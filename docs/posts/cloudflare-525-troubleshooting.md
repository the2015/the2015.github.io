---
title: 一次 Cloudflare 525 排查实录
date: 2026-11-07
description: 从源站 HTTP、HTTPS、SNI 对照到腾讯云备案拦截页，还原一次 Cloudflare 525 的证据链。
---

# 一次 Cloudflare 525 排查实录

2026 年 11 月 7 日，一个经过 Cloudflare 代理的网站无法访问，外部请求返回 `525`。最初看起来像是源站证书问题，排查后才确认：请求触发了腾讯云的未完成备案拦截。

本文保留当时的操作逻辑和关键结果。域名、服务器 IP 已替换为 `token.example.com` 与文档示例地址 `203.0.113.10`；命令需要替换为自己的值。没有收录登录凭据、私钥或用户业务数据。

## 先明确 525 说明什么

外部请求返回：

```text
HTTP/1.1 525
Server: cloudflare
```

525 说明 Cloudflare 与源站之间的 SSL/TLS 握手失败。它定位了失败发生的环节，但没有直接给出根因；证书、TLS 配置和链路中断都值得检查。

本次排查没有先换证书，也没有先重启应用，而是逐层验证请求走到了哪里。

## 第一步：应用与监听端口是否正常

登录源站后，检查 Nginx 配置、监听和容器状态：

```bash
nginx -t
ss -lntp
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
curl -I -H 'Host: token.example.com' http://127.0.0.1/
```

当时的结果是：Nginx 配置检查通过，80、443 端口正在监听，New API 容器正在运行，本机 HTTP 返回 200。

这些证据可以排除“应用已经停了”这一简单解释，但不能证明公网 HTTPS 回源正常。

## 第二步：检查实际证书与本机 HTTPS

```bash
openssl x509 -in /etc/nginx/ssl/token.example.com.pem \
  -noout -subject -issuer -dates

curl -kI --resolve token.example.com:443:127.0.0.1 \
  https://token.example.com/
```

证书来自 Cloudflare Origin CA，检查时处于有效期内，SAN 覆盖了实际使用的域名。本机 HTTPS 在跳过信任校验后返回 200。

当时普通 `curl` 曾提示 `SEC_ERROR_UNKNOWN_ISSUER`。结合签发机构看，这是系统信任库不信任 Origin CA 的表现，不能据此认定 Cloudflare 也不信任该证书。[两段连接与证书的区别](./cloudflare-https-origin-cert)在上一篇展开说明。

这一步仍只证明了本机握手和应用响应可用。

## 第三步：固定 IP，只改变 TLS 域名

最有区分力的测试不是反复访问同一个 URL，而是固定目标 IP 和 HTTP Host，只改变 TLS 握手中的 SNI。

下面是当时 Node.js 对照脚本的脱敏整理版，保存为 `probe-sni.cjs` 后执行 `node probe-sni.cjs`。它只对指定服务器发出三次 HEAD 请求：

```js
const https = require('node:https')

function probe(servername) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: '203.0.113.10',
      port: 443,
      path: '/',
      method: 'HEAD',
      servername,
      rejectUnauthorized: false,
      headers: { Host: 'token.example.com' },
      timeout: 8000
    }, res => {
      res.resume()
      resolve({ sni: servername || '(none)', status: res.statusCode })
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', err => resolve({
      sni: servername || '(none)',
      error: err.code || err.message
    }))
    req.end()
  })
}

;(async () => {
  const results = await Promise.all([
    probe(''),
    probe('localhost'),
    probe('token.example.com')
  ])
  for (const result of results) console.log(result)
})()
```

`rejectUnauthorized: false` 仅用于这次握手对照，不能作为生产客户端的常规设置。

历史结果如下，域名已替换：

| 目标 IP | HTTP Host | SNI | 结果 |
| --- | --- | --- | --- |
| 同一个源站 | `token.example.com` | 不发送 | 200 |
| 同一个源站 | `token.example.com` | `localhost` | 200 |
| 同一个源站 | `token.example.com` | `token.example.com` | `ECONNRESET` |

后续分别限定 TLS 1.2、TLS 1.3，目标域名的请求仍被重置。抓包也观察到回源 TCP 连接建立、握手数据到达后出现 RST。

这说明失败与域名有关。**仅凭 RST 不能直接断定是谁在拦截**，还需要下一步的独立证据。

## 第四步：查看 HTTP 给出的错误说明

对同一源站的 80 端口发送请求，只改变 Host：

```bash
curl -sS -D - -o /dev/null http://203.0.113.10/
curl -sS -D - -o /dev/null \
  -H 'Host: token.example.com' http://203.0.113.10/
```

使用 IP 的请求返回 200；使用目标域名的请求返回 302，Location 指向腾讯云拦截页：

```text
https://dnspod.qcloud.com/static/webblock.html?d=token.example.com
```

继续检查该页面调用的域名状态查询，得到下面这些字段。请求标识等无关字段已省略：

```json
{
  GovStatus: false,
  LandedStatus: false,
  AuditTicket: false,
  Ban: false
}
```

页面的展示配置将这组状态映射为“您的网站未完成备案”。这不是从错误码猜出的结论，而是由 HTTP 重定向、平台状态与页面提示共同支持。

这个接口是当时页面的实现细节，不是本文承诺长期稳定的公共 API。复查时优先使用实际拦截页和腾讯云控制台。

## 最终定位与处理边界

本次证据链是：应用正常、本机 HTTPS 正常、域名相关的公网握手被重置、HTTP 跳转腾讯云备案拦截页，平台状态也指向未完成备案。

因此处理方向在接入平台的备案状态。域名购买于哪家注册商，不会改变当前源站由哪家平台接入的事实；如已经完成备案，应核对接入状态或提交工单。更换部署地域则属于另一项迁移工作，需要迁移应用和数据并重新验收。

本次排查没有修改服务器配置或重启服务，也没有宣称网站已经恢复。不能因为查到原因，就把“定位完成”写成“修复完成”。

## 下次遇到同类问题

按 DNS、TCP、TLS、HTTP、应用逐层验证，记录每一步能证明什么。比较两个请求时尽量只改变一个变量；旧日志中的握手报错，要先核对时间和客户端来源，不能把无关扫描流量当作故障证据。

如果只是想让外部访问一个本地测试服务，可以继续看[Cloudflare Tunnel 入门](./cloudflare-tunnel-local-service)。它是另一种连接方式，不是这次故障已经实施的修复方案。

## 参考资料

- [Cloudflare：Error 525](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-525/)
- [Cloudflare：Origin CA certificates](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)
- [腾讯云：备案相关问题](https://cloud.tencent.com/document/product/243/19631)
- [腾讯云：网站无法访问问题](https://cloud.tencent.com/document/product/243/20220)
