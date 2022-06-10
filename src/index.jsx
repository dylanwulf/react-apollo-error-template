/*** SCHEMA ***/
import { buildASTSchema, parse } from "graphql";
import { addResolversToSchema } from "@graphql-tools/schema";

const peopleData = [
  { id: 1, name: "John Smith", extraField: 'X' },
  { id: 2, name: "Sara Smith", extraField: 'Y' },
  { id: 3, name: "Budd Deey", extraField: 'Z' },
];

const schemaAST = parse(`#graphql
  type Person {
    id: ID!
    name: String!
    extraField: String!
  }

  type Query {
    people: [Person!]!
  }

  type Mutation {
    addPerson(name: String): Person!
  }
`);

const resolvers = {
  Query: {
    people: () => peopleData,
  },
  Mutation: {
    addPerson: (_, { name }) => {
      const person = {
        id: peopleData[peopleData.length - 1].id + 1,
        name,
      };

      peopleData.push(person);
      return person;
    },
  },
};

const schema = addResolversToSchema({
  schema: buildASTSchema(schemaAST),
  resolvers,
});

/*** LINK ***/
import { graphql, print } from "graphql";
import { ApolloLink, Observable } from "@apollo/client";
function delay(wait) {
  return new Promise((resolve) => setTimeout(resolve, wait));
}

const link = new ApolloLink((operation) => {
  return new Observable(async (observer) => {
    const { query, operationName, variables } = operation;
    if (operationName === 'AllPeople2') {
     observer.error(new Error('Query 2 example failure'));
    }
    await delay(2000);
    try {
      const result = await graphql({
        schema,
        source: print(query),
        variableValues: variables,
        operationName,
      });
      observer.next(result);
      observer.complete();
    } catch (err) {
      observer.error(err);
    }
  });
});

/*** APP ***/
import React from "react";
import { createRoot } from "react-dom/client";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  gql,
  useQuery,
} from "@apollo/client";
import "./index.css";

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      id
      extraField
    }
  }
`;

const ALL_PEOPLE2 = gql`
  query AllPeople2 {
    people {
      id
      name
    }
  }
`;

function App() {
  const { loading: loading1, data: data1, error: error1 } = useQuery(ALL_PEOPLE);
  const { loading: loading2, data: data2, error: error2 } = useQuery(ALL_PEOPLE2);

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This application can be used to demonstrate an error in Apollo Client.
      </p>
      <h2>Query 1 Data:</h2>
      {error1 && `${error1}`}
      {loading1 ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {data1?.people.map((person) => (
            <li key={person.id}>{person.extraField}</li>
          ))}
        </ul>
      )}
      <h2>Query 2 Data:</h2>
      {error2 && `Error: ${error2}`}
      {loading2 ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {data2?.people.map((person) => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  }
});

client.writeQuery({
  query: ALL_PEOPLE2,
  data: {
    people: [
      { id: 1, name: "JS", __typename: 'Person' },
      { id: 2, name: "SS", __typename: 'Person' },
      { id: 3, name: "BD", __typename: 'Person' },
    ],
  },
});

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
