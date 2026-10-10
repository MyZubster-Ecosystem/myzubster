# MyZubster Ecosystem

... (conteúdo existente) ...

## 🌐 Federation Node Program
We are building a verifiable federation of independent nodes. 

### Getting Started for Operators
If you are participating in the Node Operator Program, use the specialized federation compose file to ensure your environment is sandboxed and read-only:

```bash
docker-compose -f docker-compose.federation.yml up -d
```

### Milestones & Compliance
- **Role:** Node Operator / Verifier / Maintainer.
- **Security:** Do NOT share SSH keys, tokens, or private seeds.
- **Evidence:** Use the provided `scripts/healthcheck.sh` to generate logs for provenance documentation.

For more details, see the [Linear Roadmap](https://linear.app/myzubster/issue/MYZ-260).
