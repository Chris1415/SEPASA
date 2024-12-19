import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: `https://edge-platform.sitecorecloud.io/v1/content/api/graphql/v1?sitecoreContextId=${process.env.NEXT_PUBLIC_CONTEXTID}`,
  cache: new InMemoryCache(),
});

export default client;
