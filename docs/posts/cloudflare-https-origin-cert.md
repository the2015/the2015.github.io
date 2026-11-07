---
title: Cloudflare HTTPS：两段连接与源站证书
date: 2026-11-07
description: 区分浏览器到 Cloudflare、Cloudflare 到源站的 TLS 连接，配置 Nginx 与 Origin CA，并验证 Full (strict)。
---

# Cloudflare HTTPS：两段连接与源站证书

浏览器地址栏显示 HTTPS，不足以证明 Cloudflare 到源站这一段也使用了 HTTPS，更不能证明源站证书已经通过校验。

把两段连接拆开，证书该装在哪里、为什么直连会报错，就容易理解了。

## 两段连接，两份证书

```text
浏览器 ── TLS ──→ Cloudflare ── TLS ──→ Nginx ── HTTP ──→ 本机应用
          边缘证书               源站证书                  127.0.0.1:3000
```

浏览器检查 Cloudflare 提供的边缘证书。源站证书安装在 Nginx 上，由 Cloudflare 回源时使用。这两份证书不是同一个配置入口。

本文示例是 Nginx 代理本机应用。应用和 Nginx 在同一台机器，内部转发使用 loopback HTTP；如果上游位于其他网络，需要另外设计那一段的传输保护。

## 三种常见模式

以下比较以访问者使用 HTTPS 为前提：

| 模式 | 浏览器到 Cloudflare | Cloudflare 到源站 | 是否验证源站证书 |
| --- | --- | --- | --- |
| Flexible | HTTPS | HTTP | 不适用 |
| Full | HTTPS | HTTPS | 不严格验证 |
| Full (strict) | HTTPS | HTTPS | 验证有效期、签发机构和域名 |

对于可以配置 HTTPS 的源站，本文使用 **Full (strict)**。源站证书可以来自受信任的公共 CA，也可以来自 Cloudflare Origin CA，且必须在有效期内、匹配请求或目标主机名。

Flexible 在源站强制 HTTP 跳转 HTTPS 时可能形成跳转循环：浏览器访问 HTTPS，Cloudflare 又用 HTTP 回源，源站再次要求访问 HTTPS。不要用切换模式来掩盖尚未查明的握手故障。

## Origin CA 适合什么场景

Origin CA 的证书供 Cloudflare 验证源站使用，普通浏览器并不默认信任它。因此：

- 通过橙云访问正常，而浏览器直连源站提示证书不受信任，可以是符合预期的行为。
- 如果需要浏览器或其他普通客户端直接访问源站，应使用这些客户端信任的公共 CA 证书。
- 暂停 Cloudflare 或切换灰云之前，先确认源站证书是否能被客户端直接验证。

证书名字也要匹配。`*.example.com` 可以覆盖 `blog.example.com`，但不会同时覆盖根域名 `example.com` 或更深的 `a.blog.example.com`；需要的名称应出现在证书 SAN 中。

## 在 Nginx 上配置源站证书

在 Cloudflare 的 **SSL/TLS → Origin Server** 创建证书，按实际使用情况选择域名。将证书和私钥分别保存到服务器，例如：

```text
/etc/nginx/ssl/blog.example.com.pem
/etc/nginx/ssl/blog.example.com.key
```

私钥只保留在需要使用它的服务器上。示例不包含任何真实密钥，也不应把密钥加入博客仓库。

下面是一个独立站点配置示例。已有同域名配置时应合并调整，不能额外添加重复的 `server` 块：

```nginx
server {
    listen 80;
    server_name blog.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name blog.example.com;

    ssl_certificate /etc/nginx/ssl/blog.example.com.pem;
    ssl_certificate_key /etc/nginx/ssl/blog.example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

应用需要 WebSocket、长连接或特殊超时时，再按应用要求补充配置。这里先验证普通 HTTP 请求。

保存后先检查再加载；只有配置检查通过才 reload：

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo ss -lntp 'sport = :443'
openssl x509 -in /etc/nginx/ssl/blog.example.com.pem \
  -noout -subject -issuer -dates -ext subjectAltName
```

`-ext` 需要支持该选项的 OpenSSL。老版本可以通过 `openssl x509 -in 文件 -noout -text` 查看 SAN。

## 用两种方式验证

第一步，在源站本机访问 HTTPS。临时跳过信任校验只用于判断 TLS 和应用是否可达：

```bash
curl -kI --resolve blog.example.com:443:127.0.0.1 \
  https://blog.example.com/
```

这条命令即使返回 200，也**没有证明证书可信**。需要严格验证时，从官方 Origin CA 文档取得匹配签发机构的根证书，保存为 `cloudflare-origin-ca.pem`：

```bash
curl --cacert ./cloudflare-origin-ca.pem \
  --resolve blog.example.com:443:127.0.0.1 \
  -I https://blog.example.com/
```

如果使用公共 CA 证书，通常直接使用系统信任库即可，不需要指定 Origin CA 根证书。

第二步，确认 Cloudflare 使用 Full (strict)，DNS 记录开启代理，再从外部请求：

```bash
curl -sS -D - -o /dev/null https://blog.example.com/
```

这里不加 `-k`，检查客户端验证、状态码和响应内容。若还有 525，应结合源站握手日志和网络对照继续排查；源站证书校验失败也可能表现为 526，两种错误不要混用。

## 证书没过期，也不代表链路正常

证书、监听端口和应用都正常，公网回源仍可能被防火墙、接入平台或其他网络设备中断。下一篇[525 排查实录](./cloudflare-525-troubleshooting)就是一次这样的例子。

## 参考资料

- [Cloudflare：SSL/TLS encryption modes](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/)
- [Cloudflare：Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
- [Cloudflare：Origin CA certificates](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)
- [Nginx：配置 HTTPS](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Cloudflare：Error 526](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-526/)
