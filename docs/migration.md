
# Migration Guide

This document outlines how to migrate to new major breaking versions of this library. We cover each major version in a separate section.

* [Migrating from v6 to v7](#migrating-from-v6-to-v7)
  * [Dropped Node.js v18 support](#dropped-nodejs-v18-support)
* [Migrating from v5 to v6](#migrating-from-v5-to-v6)
  * [Dropped Node.js v16 support](#dropped-nodejs-v16-support)
* [Migrating from v4 to v5](#migrating-from-v4-to-v5)
  * [Dropped Node.js v14 support](#dropped-nodejs-v14-support)
* [Migrating from v3 to v4](#migrating-from-v3-to-v4)
  * [Remove logging](#remove-logging)
  * [Remove config options](#remove-config-options)
* [Migrating from v2 to v3](#migrating-from-v2-to-v3)
  * [Dropped Node.js v12 support](#dropped-nodejs-v12-support)
* [Migrating from v1 to v2](#migrating-from-v1-to-v2)
  * [Dropped Node.js v10 support](#dropped-nodejs-v10-support)

## Migrating from v6 to v7

### Dropped Node.js v18 support

The library now only supports Node.js v20 and above.

## Migrating from v5 to v6

### Dropped Node.js v16 support

The library now only supports Node.js v18 and above.

## Migrating from v4 to v5

### Dropped Node.js v14 support

The library now only supports Node.js v16 and above.

## Migrating from v3 to v4

### Remove logging

The middleware no longer logs error information. You should do this with separate middleware if it's still required.

### Remove config options

  * The `defaultStatusCode` option has been removed and is no longer configurable. All errors which have no `status` or `statusCode` property will now default to `500`.

  * The `errorLogger` option has been removed as the middleware no longer logs error information.

  * The `errorLoggingFilter` option has been removed as the middleware no longer logs error information.

  * The `errorLoggingSerializer` option has been removed as the middleware no longer logs error information.

## Migrating from v2 to v3

### Dropped Node.js v12 support

The library now only supports Node.js v14 and above.

## Migrating from v1 to v2

### Dropped Node.js v10 support

The library now only supports Node.js v12 and above.
