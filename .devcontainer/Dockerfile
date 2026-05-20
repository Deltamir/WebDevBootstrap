FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

# Suppress the interactive "Do you want to download Yarn 4?" consent prompt
# that corepack shows when COREPACK_ENABLE_DOWNLOAD_PROMPT is unset.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Enable corepack shims, then pre-download the exact Yarn version declared in
# package.json so the image is self-contained and postCreateCommand never
# needs to fetch Yarn itself.
RUN corepack enable && corepack prepare yarn@4.14.1 --activate

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends wget gpg coreutils xdg-utils \
    && wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

RUN echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com bookworm main" | tee /etc/apt/sources.list.d/hashicorp.list

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends hcp gh

# Install gitleaks for pre-commit secret scanning
RUN GITLEAKS_VERSION=$(curl -s https://api.github.com/repos/gitleaks/gitleaks/releases/latest | grep '"tag_name"' | sed 's/.*"v\([^"]*\)".*/\1/') \
    && curl -sSfL "https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
    | tar -xz -C /usr/local/bin gitleaks

# Install Docker CLI (for docker socket access from host)
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends docker.io

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

