## Examples using Multi-tenancy
In order to use multi-tenancy examples, you need to be running Besu and Orion in multi-tenancy mode. Add extra orion keys and JWT authentication tokens to keys.js. This is for running examples only, not for use in production environments.

For example, to add a second tenant on node 1

```json
{ orion: {
  ...
    node11: {
      publicKey: "dyKxmO5Ji7d8aZTXvk02x98l6oB9Q4MBTq6W4tIW+AM=",
      jwt:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJtaXNzaW9ucyI6WyIqOioiXSwicHJpdmFjeVB1YmxpY0tleSI6ImR5S3htTzVKaTdkOGFaVFh2azAyeDk4bDZvQjlRNE1CVHE2VzR0SVcrQU09IiwiZXhwIjoxNjAwODk5OTk5MDAyfQ.psocMuOFSIIpiU6xFFLAvENGLDaTGc9nvGKQRz2OizT_sVZZowcewDWdOK5ZPDvaLSbweLNlnrDEycmNhLB0coGDf-gqK7pgeN_rMn4vMPFyBaeV3DoPnQzNl9JYrldPRzEv70Z6MInKy4mYm649Owow9K_MNuHTUjPdUZOypUVVRBae94B6PgQFrrWZnwZ3wjfZyc-e8cF8s_Ao067xjkoomBA-asYnPuMwTsyjdykypNx2Y0_cdjc8t-F1n2xWLqEvbx8QmrMNk9_2o9fURCSMd4QDq6dqswQOveTTTw2FbhicH9_dSmg_J64lFoLkg7BEDJ5yUIeZ2rF6ytv-wQ"
    }
  }
}
```