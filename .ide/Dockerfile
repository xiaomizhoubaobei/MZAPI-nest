FROM python:3.12

# 腾讯云软件源使用示例: https://cnb.cool/examples/mirrors/mirrors.cloud.tencent.com

# 以及按需安装其他软件
# RUN apt-get update && apt-get install -y git

# 安装 code-server 和 vscode 常用插件
RUN curl -fsSL https://code-server.dev/install.sh | sh \
  && code-server --install-extension redhat.vscode-yaml \
  && code-server --install-extension detachhead.basedpyright \
  && code-server --install-extension tamasfe.even-better-toml \
  && code-server --install-extension ygqygq2.turbo-file-header \
  && code-server --install-extension tencent-cloud.coding-copilot \
  && code-server --install-extension eamodio.gitlens \
  && echo done

# 安装 ssh 服务，用于支持 VSCode 客户端通过 Remote-SSH 访问开发环境
RUN apt-get update && apt-get install -y wget unzip openssh-server

# 指定字符集支持命令行输入中文（根据需要选择字符集）
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8