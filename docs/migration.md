
# Migration Guide

This document outlines how to migrate to new major breaking versions of this library. We cover each major version in a separate section.

## Table of Contents

  * [Migrating from v3 to v4](#migrating-from-v3-to-v4)
  * [Migrating from v2 to v3](#migrating-from-v2-to-v3)
  * [Migrating from v1 to v2](#migrating-from-v1-to-v2)

## Migrating from v3 to v4

The following breaking changes were made as part of this version:

  * The middleware no longer logs error information. You should do this with separate middleware if it's still required.

  * The `defaultStatusCode` option has been removed and is no longer configurable. All errors which have no `status` or `statusCode` property will now default to `500`.

  * The `errorLogger` option has been removed as the middleware no longer logs error information.

  * The `errorLoggingFilter` option has been removed as the middleware no longer logs error information.

  * The `errorLoggingSerializer` option has been removed as the middleware no longer logs error information.

## Migrating from v2 to v3

The only breaking change in this version is that support for Node.js v12 was dropped. The library now only works in Node.js v14 and above.

## Migrating from v1 to v2

The only breaking change in this version is that support for Node.js v10 was dropped. The library now only works in Node.js v12 and above.
