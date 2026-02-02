import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/graphql/typeDefs/**/*.graphql", // or .ts if SDL-in-code
  generates: {
    "src/graphql/generated/types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "../context/auth.context#MyContext", // your server context type
        useIndexSignature: true,
      },
    },
  },
};

export default config;
