# Typesafe REST API Specification - Zod Data Validation Related Libraries

[![CI Pipeline](https://github.com/ty-ras/data-zod/actions/workflows/ci.yml/badge.svg)](https://github.com/ty-ras/data-zod/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/ty-ras/data-zod/actions/workflows/cd.yml/badge.svg)](https://github.com/ty-ras/data-zod/actions/workflows/cd.yml)

The Typesafe REST API Specification (TyRAS) is a family of libraries used to enable seamless development of Backend and/or Frontend which communicate via HTTP protocol.
The protocol specification is checked both at compile-time and run-time to verify that communication indeed adhers to the protocol.
This all is done in such way that it does not make development tedious or boring, but instead robust and fun!

This particular repository contains related libraries related to using TyRAS with [`Zod`](https://github.com/colinhacks/zod) data validation library:
- [data](./data) folder contains `Zod`-specific library `@ty-ras/data-zod` commonly used by both frontend and backend,
- [data-backend](./data-backend) folder contains `Zod`-specific library `@ty-ras/data-backend-zod` used by backend,
- [state](./state) folder contains `io-ts`-specific library `@ty-ras/state-zod` used by backend 
- [data-frontend](./data-frontend) folder contains `Zod`-specific library `@ty-ras/data-frontend-zod` used by frontend, and
- [metadata-jsonchema](./metadata-jsonschema) folder contains `Zod`-specific library `@ty-ras/metadata-jsonschema-zod` used to transform `Zod` validators into [JSON schema](https://json-schema.org/) objects.
  It is typically used by backend, but it is not restricted to that.