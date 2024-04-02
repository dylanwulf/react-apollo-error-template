/*** SCHEMA ***/
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from 'graphql';

const PersonType = new GraphQLObjectType({
  name: 'Person',
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    age: { type: GraphQLInt}
  },
});

const peopleData = [
  { id: 1, name: 'John Smith', age: 30 },
  { id: 2, name: 'Sara Smith', age: 31 },
  { id: 3, name: 'Budd Deey', age: 999 },
];

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    people: {
      type: new GraphQLList(PersonType),
      resolve: () => peopleData,
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addPerson: {
      type: PersonType,
      args: {
        name: { type: GraphQLString },
      },
      resolve: function (_, { name }) {
        const person = {
          id: peopleData[peopleData.length - 1].id + 1,
          name,
        };

        peopleData.push(person);
        return person;
      }
    },
  },
});

export const schema = new GraphQLSchema({ query: QueryType, mutation: MutationType });
