import React from 'react';
import { AsyncStorage, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createSwitchNavigator, createStackNavigator } from 'react-navigation';
// import MainScreen from '../screens/MainScreen';
import {SubmitAnswerScreen} from '../screens/MainScreen';
import {AnswerListScreen} from '../screens/MainScreen';
import {LoadGames} from '../screens/MainScreen';
import { ApolloProvider, Mutation, Query, withApollo } from "react-apollo";
import ApolloClient from "apollo-boost";
import gql from "graphql-tag";
import { persistCache } from 'apollo-cache-persist';
import { InMemoryCache } from 'apollo-cache-inmemory';


const cache = new InMemoryCache();

persistCache({
  cache,
  storage: AsyncStorage,
});

const defaults = {
  currentUser: null
}

const typeDefs = `
type Query {
  currentUser: String
}
`;

const client = new ApolloClient({
  cache,
  uri: "https://us1.prisma.sh/jagreenf111-8fe67d/prisma-liveqa/dev",
  clientState: {
    defaults,
    typeDefs
  }
});

// Apollo queries and mutations
const GET_USER = gql`
{
  currentUser @client
}
`;

const CREATE_USER = gql`
mutation createUser {
  createUser {
    id
  }
}`;

// Load the user of this app, otherwise create a new one.
class _StartUpScreen extends React.Component {

  async componentDidMount() {
    this.client = this.props.client;
    var user = null;
    try {
      var {data: {currentUser: user}} = await this.client.query({query: GET_USER})
      console.log("user from cache: ", user);
    }
    catch(err) {
      console.log("get user query failed: ", err);
    }

    if(user == null) {
      try {
        var {data: {createUser: user}} = await client.mutate({
          mutation: CREATE_USER,
          update: (cache, { data: { createUser } }) => {
            console.log("Updating current user: ", createUser.id);
            cache.writeQuery({
              query: GET_USER,
              data: { currentUser: createUser.id}
            });
          }
        });
        console.log("user from mutation: ", user);
      }
      catch(err) {
        console.log("create user failed: ", err);
      }
    }
    if(user == null) {
      console.log("Unable to get or create user");
    }
    else {
      console.log("Navigating to LoadGame");
      this.props.navigation.navigate('Load', {user});
    }
  }

  render() {
    return (
      <View>
        <ActivityIndicator />
      </View>
    );
  }
}

var StartUpScreen = withApollo(_StartUpScreen);

const AppNavigator = createSwitchNavigator(
  {
    Load: LoadGames,
    Start: StartUpScreen
  },
  {
    initialRouteName: 'Start',
  }
);

export default class RootNavigation extends React.Component {

  render() {

    return (
      <ApolloProvider client={client}>
        <AppNavigator />
      </ApolloProvider>

    );
  }



}
