FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

# Enable corepack at build time so Yarn 4 (declared in package.json
# "packageManager") is active from the very first shell session.
# Without this, the container defaults to Yarn 1 and can't read the
# Yarn 4 lockfile format.
RUN corepack enable

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends wget gpg coreutils xdg-utils \
    && wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

RUN echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com bookworm main" | tee /etc/apt/sources.list.d/hashicorp.list

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends hcp

