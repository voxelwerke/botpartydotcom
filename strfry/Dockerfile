FROM debian:bookworm-slim AS builder

ARG STRFRY_REF=master

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    g++ \
    git \
    libflatbuffers-dev \
    liblmdb-dev \
    libsecp256k1-dev \
    libssl-dev \
    libzstd-dev \
    make \
    pkg-config \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN git clone --depth 1 --branch "${STRFRY_REF}" https://github.com/hoytech/strfry.git

WORKDIR /src/strfry
RUN git submodule update --init && make setup-golpe && make -j2

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libflatbuffers2 \
    liblmdb0 \
    libsecp256k1-1 \
    libssl3 \
    libzstd1 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /src/strfry/strfry /usr/local/bin/strfry
COPY strfry.conf /etc/strfry.conf

RUN mkdir -p /var/lib/strfry

ENV STRFRY_CONFIG=/etc/strfry.conf

VOLUME ["/var/lib/strfry"]
EXPOSE 7777

CMD ["strfry", "relay"]
