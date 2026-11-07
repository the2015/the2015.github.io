---
title: 用 Cloudflare Tunnel 访问本地服务
date: 2026-11-07
description: 用一个本地静态页面演示 Quick Tunnel，再配置固定域名的托管隧道，理解回源地址、访问控制和故障排查。
---

# 用 Cloudflare Tunnel 访问本地服务

本地页面已经跑起来，想让别人临时看一下，却没有公网 IP，也不方便配置路由器端口转发。这是 Cloudflare Tunnel 很适合处理的场景。

本文是一份操作教程，用独立测试页面演示，不把开发机上的整个项目目录直接暴露出去。命令以 Linux 为例；Windows 可以从官方提供的安装方式中选择对应版本。

## 请求是怎样进来的

普通反向代理要求源站接收入站连接。Tunnel 的连接器 `cloudflared` 主动向 Cloudflare 建立连接，再把请求转给本机服务：

```text
访问者 → Cloudflare → 已建立的 Tunnel → cloudflared → 127.0.0.1:8080
```

源站不必拥有公网 IP，也不需要为这个服务开放公网入站端口。但机器必须能连到 Cloudflare；没有出站网络，隧道同样不能工作。

## 先准备一个最小本地服务

按官方安装页面安装 `cloudflared`，随后确认版本：

```bash
cloudflared --version
```

准备仅包含测试页面的目录。在一个终端中运行：

```bash
mkdir -p $HOME/tunnel-demo
printf '%s\n' '<!doctype html><title>Tunnel demo</title><h1>Tunnel works</h1>' \
  > $HOME/tunnel-demo/index.html
python3 -m http.server 8080 --bind 127.0.0.1 --directory $HOME/tunnel-demo
```

在另一个终端验证本地响应：

```bash
curl -i http://127.0.0.1:8080/
```

先确认状态为 200，正文包含 `Tunnel works`。本地服务都不可用时，创建隧道只会多增加一层排查成本。

## 用 Quick Tunnel 临时分享

运行：

```bash
cloudflared tunnel --url http://127.0.0.1:8080
```

终端会打印一个随机的 `trycloudflare.com` 地址。用另一台设备或其他网络打开这个实际生成的地址，检查页面内容。

Quick Tunnel 无需 Cloudflare 账号或自己的域名。停止 `cloudflared` 进程后，该地址失效；重新创建时地址会变化。

截至本文核对文档时，Quick Tunnel 用于测试开发，没有可用性保证，最多支持 200 个同时处理中的请求，不支持 SSE。需要稳定地址或测试 SSE 流式响应时，应单独评估正式隧道，不要把 Quick Tunnel 当作等价环境。

临时分享完成后，分别在两个终端按 Ctrl+C，关闭隧道和本地 HTTP 服务。

## 配置固定域名的托管隧道

需要长期访问时，使用账号下的正式隧道，并准备一个已接入 Cloudflare 的域名。这里使用 `demo.example.com`。

1. 在 Cloudflare 控制台进入 **Networking → Tunnels**，创建一个使用 `cloudflared` 的隧道。
2. 选择目标机器的操作系统，按控制台生成的安装或运行命令部署连接器。
3. 确认控制台出现连接器，并检查隧道状态为 `Healthy`。
4. 在隧道的 **Routes** 中添加 **Published application**。
5. 主机名填写 `demo.example.com`，Service URL 填写 `http://127.0.0.1:8080`，保存。

控制台导航可能调整，实际名称以官方创建教程和账号界面为准。不要同时保留同名、指向其他目标的 DNS 记录；出现冲突时先确认旧记录的用途。

控制台生成的命令可能包含 tunnel token，它属于连接凭据，不应出现在博客、截图或代码仓库中。

如果采用 systemd 服务方式安装连接器，可以检查：

```bash
systemctl status cloudflared --no-pager
journalctl -u cloudflared --since '10 minutes ago' --no-pager
curl -i https://demo.example.com/
```

注意，连接器作为服务启动，不会自动把前面的 Python 测试服务也变成后台服务。正式使用时，应用本身也需要独立的进程管理。

## localhost 指的是哪台机器

Service URL 是从 **cloudflared 所在的环境**发起连接的地址。

如果 `cloudflared` 运行在 Docker 容器中，`127.0.0.1` 指向该容器自己，不是宿主机，也不是另一个应用容器。此时需要使用容器网络内可达的服务名，或正确的宿主机地址。

另一个常见错误是协议填错：本地监听 HTTP，就填写 `http://`；填写 `https://` 不会让一个 HTTP 服务自动获得 TLS。

## 管理页面需要额外的访问控制

公开应用路由可以让外部访问页面，本身不等于只有自己能访问。测试页可以公开；管理界面应先配置 Cloudflare Access 的自托管应用和允许策略，再对外提供入口，并保留应用自身所需的认证。

验收访问控制时，用未登录的浏览器会话确认访问会被要求认证或拒绝，再用允许的身份测试。不要只在自己已经登录的浏览器里检查一次。

## 按顺序排查

| 现象 | 优先检查 |
| --- | --- |
| 本机访问失败 | 应用进程、监听端口、URL 协议 |
| 隧道不是 Healthy | 连接器日志、凭据、出站网络；官方要求检查到 Cloudflare 的 7844 端口 |
| 隧道健康但页面报 502 | cloudflared 是否能访问 Service URL，容器中的 localhost 是否指错 |
| 能访问，但不是目标页面 | 主机名、路由和本地服务是否对应 |
| Quick Tunnel 的流式接口失败 | 是否依赖不受支持的 SSE |

停止分享时移除对应公开路由，按需要停止连接器，并核对关联 DNS 记录。若一个连接器承载多个应用，不要直接停止整条隧道。

下一篇：[Cloudflare 缓存配置与排查](./cloudflare-cache-debugging)。

## 参考资料

- [Cloudflare：Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
- [Cloudflare：安装 cloudflared](https://developers.cloudflare.com/tunnel/downloads/)
- [Cloudflare：Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)
- [Cloudflare：通过控制台创建隧道](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)
- [Cloudflare：自托管应用的 Access 配置](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/)
- [Cloudflare：连接检查](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/troubleshoot-tunnels/connectivity-prechecks/)
