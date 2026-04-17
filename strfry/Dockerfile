FROM alpine:3.20 AS builder

ARG STRFRY_REF=master

RUN apk add --no-cache \
    linux-headers \
    git \
    g++ \
    make \
    perl \
    pkgconfig \
    libtool \
    ca-certificates \
    libressl-dev \
    zlib-dev \
    lmdb-dev \
    flatbuffers-dev \
    libsecp256k1-dev \
    zstd-dev

WORKDIR /src
RUN git clone --depth 1 --branch "${STRFRY_REF}" https://github.com/hoytech/strfry.git

WORKDIR /src/strfry
RUN git submodule update --init \
    && make setup-golpe \
    && make -j"$(nproc)"

FROM alpine:3.20

RUN apk add --no-cache \
    ca-certificates \
    lmdb \
    flatbuffers \
    libsecp256k1 \
    libb2 \
    zstd \
    libressl

COPY --from=builder /src/strfry/strfry /usr/local/bin/strfry
COPY strfry.conf /etc/strfry.conf

RUN mkdir -p /var/lib/strfry

ENV STRFRY_CONFIG=/etc/strfry.conf

VOLUME ["/var/lib/strfry"]
EXPOSE 7777

CMD ["strfry", "relay"]
