# 发布标题

Cloudflare 525 不要先换证书：一次从 TLS 握手到备案拦截的排查

# 短介绍

Cloudflare 返回 525，只能说明 Cloudflare 与源站之间的 SSL/TLS 握手失败，不能直接等同于“证书过期”。本文用一组只改变一个变量的对照测试，展示如何把通用错误码缩小到具体链路；文中的备案拦截结论只适用于这一次案例，不能套用到所有 525。

# 正文

遇到 525 时，最容易走偏的做法是先换证书、重启应用，或者反复刷新同一个 URL。更有区分力的顺序是：先确认应用和监听，再验证源站 HTTPS，最后比较固定 IP 下的 Host 与 TLS SNI。

## 1. 先确认源站本身还在工作

登录源站后先执行：

```bash
nginx -t
ss -lntp
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
curl -I -H 'Host: token.example.com' http://127.0.0.1/
```

这次记录到的结果是：Nginx 配置检查通过，80、443 正在监听，New API 容器运行中，本机 HTTP 返回 200。它只能排除“应用已经停了”这一类原因，不能证明公网回源的 HTTPS 正常。

## 2. 分开检查证书和本机 HTTPS

```bash
openssl x509 -in /etc/nginx/ssl/token.example.com.pem \
  -noout -subject -issuer -dates

curl -kI --resolve token.example.com:443:127.0.0.1 \
  https://token.example.com/
```

案例中的证书来自 Cloudflare Origin CA，检查时在有效期内，SAN 覆盖实际域名；本机 HTTPS 在跳过信任校验后返回 200。普通 `curl` 曾提示 `SEC_ERROR_UNKNOWN_ISSUER`，这说明当前系统信任库不认识 Origin CA，不能据此断定 Cloudflare 也不信任它。

`-k` 只用于这次诊断，生产客户端不要把它当作证书校验方案。需要严格验证时，应使用匹配的 Origin CA 根证书，或改用普通客户端信任的公共 CA 证书。

## 3. 固定 IP，只改变 TLS 的 SNI

固定同一个源站 IP 和 HTTP `Host`，分别把 TLS `servername` 设为空、`localhost` 和目标域名，发送 HEAD 请求并记录状态码或错误。Node.js 对照请求的关键参数如下，`203.0.113.10` 和域名都是脱敏示例，请替换成自己的值：

```js
https.request({
  hostname: '203.0.113.10',
  port: 443,
  method: 'HEAD',
  servername,
  rejectUnauthorized: false,
  headers: { Host: 'token.example.com' },
  timeout: 8000
})
```

这次历史结果如下：

| 同一源站 IP | HTTP Host | SNI | 结果 |
| --- | --- | --- | --- |
| 是 | `token.example.com` | 不发送 | 200 |
| 是 | `token.example.com` | `localhost` | 200 |
| 是 | `token.example.com` | `token.example.com` | `ECONNRESET` |

限定 TLS 1.2、TLS 1.3 后，目标域名仍被重置；抓包也看到 TCP 已建立、握手数据到达后出现 RST。这说明失败与域名有关，但单凭 RST 还不能断定拦截者是谁。

## 4. 用 HTTP Host 找独立证据

再对同一 IP 的 80 端口只改变 `Host`：

```bash
curl -sS -D - -o /dev/null http://203.0.113.10/
curl -sS -D - -o /dev/null \
  -H 'Host: token.example.com' http://203.0.113.10/
```

案例中，直接用 IP 返回 200；带目标域名则返回 302，`Location` 指向：

```text
https://dnspod.qcloud.com/static/webblock.html?d=token.example.com
```

继续查看拦截页使用的状态字段，得到 `GovStatus: false`、`LandedStatus: false`、`AuditTicket: false`、`Ban: false`。页面展示将这组状态映射为“您的网站未完成备案”。HTTP 重定向、平台状态和页面提示三者相互印证，才足以支持这次案例的定位。

## 结论和边界

这条证据链是：应用正常；本机 HTTPS 正常；公网握手在目标域名下被重置；HTTP 又跳转到腾讯云备案拦截页，平台状态也指向未完成备案。因此处理方向是核对接入平台的备案状态；如果已经完成备案，应检查接入状态或提交工单。

这次排查没有修改服务器配置、重启服务，也没有声称网站已经恢复。“定位到原因”不等于“修复完成”。如果你的 HTTP 请求没有出现类似独立证据，就不要把本案例结论套到自己的 525 上，继续检查证书有效期和 SAN、TLS 配置、源站防火墙、虚拟主机和接入链路。证书校验失败也可能表现为 526，525 和 526 不要混用。

完整脚本、命令解释和证据链见博客：

- [一次 Cloudflare 525 排查实录](https://the2015.github.io/posts/cloudflare-525-troubleshooting?utm_source=juejin&utm_medium=article&utm_campaign=blog-launch-2026-11&utm_content=cf525)
- [Cloudflare HTTPS：两段连接与源站证书](https://the2015.github.io/posts/cloudflare-https-origin-cert?utm_source=juejin&utm_medium=article&utm_campaign=blog-launch-2026-11&utm_content=cf-https)
- [博客仓库与问题区](https://github.com/the2015/the2015.github.io/issues)

# 发布前说明

- 站内链接使用 VitePress 的公开 clean URL；查询参数只用于来源统计。
- IP、域名和脚本均沿用文章中的脱敏示例，发布时不要替换成真实凭据或私钥。
- 本稿没有加入截图、实时恢复结果或对腾讯云接口长期稳定性的承诺。
