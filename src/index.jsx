/*** APP ***/
import React, { StrictMode, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createRoot } from "react-dom/client";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  gql,
  useQuery,
  useMutation,
} from "@apollo/client";

import { link } from "./link.js";
import { Subscriptions } from "./subscriptions.jsx";
import { Layout } from "./layout.jsx";
import "./index.css";

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      id
      name
    }
  }
`;

const ADD_PERSON = gql`
  mutation AddPerson($name: String) {
    addPerson(name: $name) {
      id
      name
    }
  }
`;

const QUERY_PEOPLE_2 = gql`
  query People2 {
    people {
      id
      age
    }
  }
`

const PollingComponent = () => {
  useQuery(QUERY_PEOPLE_2, { pollInterval: 1000, notifyOnNetworkStatusChange: true, skip: false, onCompleted: (data) => {
    console.log('completed data:', data)
  } });

  return <div>Polling!</div>
}

function App() {
  const [name, setName] = useState("");
  const { loading, data } = useQuery(ALL_PEOPLE);
  const [polling, setPolling] = useState(false);

  const [addPerson] = useMutation(ADD_PERSON, {
    update: (cache, { data: { addPerson: addPersonData } }) => {
      const peopleResult = cache.readQuery({ query: ALL_PEOPLE });

      cache.writeQuery({
        query: ALL_PEOPLE,
        data: {
          ...peopleResult,
          people: [...peopleResult.people, addPersonData],
        },
      });
    },
  });

  return (
    <main>
      <h3>Home</h3>
      <div className="add-person">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(evt) => setName(evt.target.value)}
        />
        <button
          onClick={() => {
            addPerson({ variables: { name } });
            setName("");
          }}
        >
          Add person
        </button>
      </div>
      <h2>Names</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {data?.people.map((person) => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
      )}
      <button onClick={() => {
        setPolling(currentVal => !currentVal);
      }}>
        Toggle Polling
      </button>
      {polling && <PollingComponent />}
    </main>
  );
}

const client = new ApolloClient({
  queryDeduplication: false,
  cache: new InMemoryCache(),
  link,
  defaultOptions: {
    watchQuery: {
      // specify our preferred default fetch policy
      fetchPolicy: 'cache-and-network',
      // explanation of what "nextFetchPolicy" is: https://github.com/apollographql/apollo-client/issues/6760#issuecomment-668188727
      // ability to specify nextFetchPolicy function in defaultOptions: https://github.com/apollographql/apollo-client/issues/6833#issuecomment-679446789
      // istanbul ignore next - not worth the effort of testing this
      nextFetchPolicy(lastFetchPolicy) {
        if (lastFetchPolicy === 'cache-and-network' || lastFetchPolicy === 'network-only') {
          return 'cache-first';
        }
        return lastFetchPolicy;
      },
    },
  }
});

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <StrictMode>
    <ApolloProvider client={client}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<App />} />
            <Route path="subscriptions-wslink" element={<Subscriptions />} />
          </Route>
        </Routes>
      </Router>
    </ApolloProvider>
  </StrictMode>
);
