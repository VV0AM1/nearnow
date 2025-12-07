"use client";

import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from "@apollo/client";

const client = new ApolloClient({
    link: new HttpLink({
        uri: "http://127.0.0.1:4000/graphql",
    }),
    cache: new InMemoryCache(),
});

export function ApolloWrapper({ children }: React.PropsWithChildren) {
    return (
        <ApolloProvider client={client}>
            {children}
        </ApolloProvider>
    );
}
