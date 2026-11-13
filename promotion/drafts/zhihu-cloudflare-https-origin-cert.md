# 发布标题

Cloudflare 的 HTTPS 到底要配几张证书？525、526 和 Origin CA 怎么排查？

# 短介绍

浏览器看到 HTTPS，只能证明浏览器到 Cloudflare 的一段连接；Cloudflare 回源到 Nginx 还有另一段 TLS。把两段连接、证书信任和错误码分开，才能判断应该改 SSL/TLS 模式、换证书，还是继续查网络和接入平台。

# 适合回答的问题

为什么 Cloudflare 橙云访问正常，直连源站却提示证书不受信任？出现 525 时是不是一定要重新申请证书？

# 回答正文

先画出连接关系：

```text
浏览器 ── TLS ──→ Cloudflare ── TLS ──→ Nginx ── HTTP ──→ 本机应用
          边缘证书               源站证书                  127.0.0.1:3000
```

浏览器校验 Cloudflare 提供的边缘证书；Cloudflare 回源时校验的是安装在 Nginx 上的源站证书。两份证书不是同一个配置入口。

## SSL/TLS 模式怎么选

| 模式 | 浏览器到 Cloudflare | Cloudflare 到源站 | 是否严格验证源站证书 |
| --- | --- | --- | --- |
| Flexible | HTTPS | HTTP | 不适用 |
| Full | HTTPS | HTTPS | 否 |
| Full (strict) | HTTPS | HTTPS | 是 |

能够配置源站 HTTPS 时，通常应以 Full (strict) 为目标。源站证书可以来自受信任的公共 CA，也可以来自 Cloudflare Origin CA，但都要在有效期内，并覆盖实际使用的主机名。Flexible 在源站强制跳转 HTTPS 时还可能造成循环，不应拿它掩盖尚未查明的握手故障。

## Origin CA 为什么会让直连看起来“有问题”

Origin CA 证书是给 Cloudflare 验证源站使用的，普通浏览器和系统信任库通常不会默认信任它。因此可能出现：橙云访问正常，暂停代理或直连源站却提示证书不受信任。这不自动说明 Cloudflare 回源失败。

如果源站还要被浏览器或其他普通客户端直接访问，应使用这些客户端信任的公共 CA 证书。无论证书来自哪里，都要检查 SAN：`*.example.com` 可以覆盖 `blog.example.com`，但不能覆盖根域名 `example.com` 或更深的 `a.blog.example.com`。

## 一个最小的 Nginx 配置检查路径

下面是独立站点配置的核心部分。已有同域名配置时应合并调整，不要重复添加 `server` 块：

```nginx
server {
    listen 443 ssl;
    server_name blog.example.com;
    ssl_certificate /etc/nginx/ssl/blog.example.com.pem;
    ssl_certificate_key /etc/nginx/ssl/blog.example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

保存后先检查再加载：

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo ss -lntp 'sport = :443'
openssl x509 -in /etc/nginx/ssl/blog.example.com.pem \
  -noout -subject -issuer -dates -ext subjectAltName
```

## 两步验证，不要只看一个 200

先在源站本机验证 TLS 和应用是否可达：

```bash
curl -kI --resolve blog.example.com:443:127.0.0.1 \
  https://blog.example.com/
```

这里的 `-k` 跳过了信任校验，所以即使返回 200，也没有证明证书可信。需要严格验证时，使用官方 Origin CA 文档中匹配的根证书：

```bash
curl --cacert ./cloudflare-origin-ca.pem \
  --resolve blog.example.com:443:127.0.0.1 \
  -I https://blog.example.com/
```

再确认 Cloudflare 使用 Full (strict)、DNS 记录开启代理，从外部请求：

```bash
curl -sS -D - -o /dev/null https://blog.example.com/
```

## 525 和 526 怎么区分

- **525**：Cloudflare 与源站的 SSL/TLS 握手失败。它只定位了失败环节，证书、TLS 配置、防火墙或接入链路都可能需要检查。
- **526**：Cloudflare 无法验证源站证书。此时重点检查有效期、签发机构、SAN 和 Full (strict) 配置。

即使证书没过期、Nginx 在监听、本机请求返回 200，公网回源仍可能被防火墙、接入平台或其他网络设备中断。遇到这种情况，固定目标 IP，只改变 TLS SNI 和 HTTP Host 做对照，比重复访问同一个地址更有区分力。

我记录过一个具体案例：本机 HTTP/HTTPS 都正常，目标域名的公网握手被重置；同一源站的 HTTP 请求带目标域名后跳转到腾讯云备案拦截页，平台状态也指向未完成备案。因此那一次的处理方向是核对接入平台备案状态，而不是先换证书。这个结论属于该案例的证据链，不能泛化为所有 525 的根因。

完整配置、验证命令和案例边界：

- [Cloudflare HTTPS：两段连接与源站证书](https://the2015.github.io/posts/cloudflare-https-origin-cert?utm_source=zhihu&utm_medium=answer&utm_campaign=blog-launch-2026-11&utm_content=cf-https)
- [一次 Cloudflare 525 排查实录](https://the2015.github.io/posts/cloudflare-525-troubleshooting?utm_source=zhihu&utm_medium=answer&utm_campaign=blog-launch-2026-11&utm_content=cf525)
- [博客仓库与问题区](https://github.com/the2015/the2015.github.io/issues)

# 发布前说明

- `blog.example.com`、证书路径和本机端口是配置示例，发布者应替换为自己的值。
- `curl -k` 仅用于诊断，不应写进生产客户端的常规配置。
- 本稿不承诺任何当前证书供应商政策、上游价格或某个接入平台接口的长期可用性。
