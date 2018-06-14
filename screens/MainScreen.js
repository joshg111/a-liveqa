import React from 'react';
import { Button, ScrollView, StyleSheet, Text, View, FlatList, TextInput } from 'react-native';
import gql from "graphql-tag";
import { Query, Mutation } from "react-apollo";

class MyListItem extends React.PureComponent {

  render() {
    console.log("rendering MyListItem");
    return (
      <View style={{backgroundColor: 'white', margin: 5}}>
        <Text>
          {this.props.myAnswer}
        </Text>
      </View>
    );
  }
}

const renderQuestion = ({game}) => (
  <View style={{flex: 1}}>
    <ScrollView contentContainerStyle={{
      backgroundColor: 'orange',
      margin: 5,
      flexDirection: 'column', alignItems: 'center'}}>
      <View style={{}}>
      <Text style={{fontWeight: 'bold', fontSize: 26, margin: 5}}>
        Question
      </Text>
      </View>
      <View style={{paddingHorizontal: 20}}>
      <Text style={{fontWeight: 'bold', margin: 7}}>
        {game.question}
      </Text>
      </View>
    </ScrollView>
  </View>
);

export class AnswerListScreen extends React.Component {

  constructor(props) {
    super(props);

  }

  _keyExtractor = (item, index) => item.id;

  _renderItem = ({item}) => (
    <MyListItem
      id={item.id}
      myAnswer={item.myAnswer}
    />
  );

  render() {
    var game = this.props.game;
    return (
      <View style={{flex: 1,
        flexDirection: 'column'}}>

        <View style={{flex: 1}}>
          {renderQuestion({game})}
        </View>

        <View style={{flex: 3}}>
          <FlatList
            data={game.answers}
            extraData={this.state}
            keyExtractor={this._keyExtractor}
            renderItem={this._renderItem}
          />
        </View>

      </View>
    );
  }
}

class Timer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {remaining: this.props.seconds};
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidUpdate(prevProps) {
    console.log("updating props, seconds = ", this.props.seconds);
    if(prevProps.seconds != this.props.seconds) {
      this.setState({remaining: this.props.seconds});
    }
  }

  componentDidMount() {

    this.timer = setInterval(() => {
      console.log("tick");
      this.setState({remaining: this.state.remaining-1})
      if(this.state.remaining <= 0) {
        clearInterval(this.timer);
        this.props.onCompleted();
      }

    }, 1000);

  }

  render() {
    var seconds = this.state.remaining % 60;
    var minutes = Math.floor(this.state.remaining / 60);
    if(this.state.remaining <= 0) {
      return (null);
    }
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <Text style={{fontWeight: 'bold', fontSize: 24, textAlign: 'center'}}>Time Left</Text>
        </View>
        <View style={{flexDirection:'row', flex: 1, justifyContent: 'space-evenly', alignItems: 'center', backgroundColor: 'pink'}}>

            {minutes ? (
              <Text style={styles.timerText}>
                {minutes} Minute{minutes > 1 ? 's' : ''}
              </Text>) : null}


            <Text style={styles.timerText}>
              {seconds} Seconds
            </Text>


        </View>
      </View>

    );

  }

}

const CREATE_ANSWER = gql`
mutation createAnswer($userID: ID!, $myAnswer: String!, $gameID: ID!) {
  createAnswer(
    data:{
      myAnswer: $myAnswer
    	game:{connect:{id:$gameID}}
      user: {
        connect: {id: $userID}
      }
  	}) {
    id
  }
}
`;

export class SubmitAnswerScreen extends React.Component {

  constructor(props) {
    super(props);

    this.state = {text: '', completed: false}
    // this.remaining = timeLeft(this.props.game);
    console.log("SubmitAnswerScreen: game = ", this.props.game);
  }

  componentDidMount() {

  }

  createAnswerMutation() {

  }

  render() {
    console.log("render SubmitAnswerScreen");
    if(this.state.completed) {
      return <View style={{flex:1, alignItems: 'center', justifyContent: 'center'}}><Text>Loading Answers</Text></View>
    }
    return (
      <View style={{flex: 4, backgroundColor: 'green'}}>
        <Mutation
          mutation={CREATE_ANSWER}
          onCompleted={() => this.setState({completed: true})}
          // update: (cache, { data: { createAnswer } }) => {
          //   console.log("Updating game answer: ", createAnswer.answers);
          //   cache.readQuery({
          //     query: GET_GAME,
          //
          //   });
          //   cache.writeQuery({
          //     query: GET_GAME,
          //     data: { currentUser: createUser.id}
          //   });
          // }
        >
          {(createAnswer, {data}) => (
            <View style={{flex: 4, flexDirection:'column', backgroundColor: 'silver'}}>
              {renderQuestion({game: this.props.game})}
              <View style={{flex: 1, backgroundColor: 'cyan', margin: 5}}>
                <Timer seconds={timeLeft(this.props.game)} onCompleted={() => this.setState({completed: true})} />
              </View>
              <View style={{backgroundColor: 'white', flex: 1, margin: 5}}>
                <TextInput
                  multiline = {true}
                  numberOfLines = {4}
                  maxLength = {400}
                  onChangeText={(text) => this.setState({text})}
                  value={this.state.text}
                  placeholder={"Your Answer"}
                />
                <View style={{padding: 30}}>
                  <Button
                    title={"Submit"}
                    onPress={() => {
                      createAnswer({variables: {userID: this.props.currentUser.id, gameID: this.props.game.id, myAnswer: this.state.text}});
                    }}
                  />
                </View>
              </View>

            </View>
          )}
        </Mutation>
      </View>
    );
  }
}

const timeLeft = (game) => {
  // return 500;
  var date = new Date(game.createdAt);
  console.log("before date: ", date);
  date.setMinutes(date.getMinutes() + game.duration);
  return (Math.floor((date - (new Date())) / 1000));
}

const isGameLive = (game) => {
  console.log(game);
  var res = (timeLeft(game) > 0);
  console.log("is game live: ", res);
  return res;
}

const isGameAnswered = (game, user) => {
  for(var answer of game.answers) {
    if(answer.user.id === user.id) {
      console.log("isGameAnswered: true");
      return true;
    }
  }
  console.log("isGameAnswered: false");
  return false;
}

export class LoadGames extends React.Component {
  constructor(props) {
    // Props will have a user object, which could come from the loading component.
    // Loading component will load initial state like user.
    super(props);

    this.user = this.props.navigation.state.params.user;
    // this.user = this.props.user;
    console.log("user = ", this.user);
  }

  pickComponent(game) {
    // return (<SubmitAnswerScreen game={game}/>);
    if(isGameLive(game) && !isGameAnswered(game, this.user)) {
      // If game is live and not answered, submit your answer.
      return (<SubmitAnswerScreen game={game} currentUser={this.user}/>);
    }
    else {
      return (<AnswerListScreen game={game}/>);
    }
  }

  render() {
    return (
      <View style={{flex:1, backgroundColor: 'lightgreen'}}>
        <Query
        query={GET_GAME}
        pollInterval={10000}>
        {({ loading, error, data }) => {
          console.log("rendering query children LoadGames");
          if (loading) {
            return (
              <Text>Loading...</Text>
            );
          }
          if (error) {
            return <Text>`Error! ${error.message}`</Text>;
          }
          var game = data.games ? data.games[0] : null;
          if(game === null) {
            return (
              <Text>No Game Found</Text>
            );
          }

          return (
            this.pickComponent(game)
          );
        }}
        </Query>
      </View>
    );
  }
}

// export default class MainScreen extends React.Component {
//
//   constructor(props) {
//     super(props);
//     console.log(props);
//     // id: id of game.
//     // state: `new` when this game is new to the user.
//     // `live`: Game is now live.
//     // `userCompleted` when this user has completed the their necessary actions for the game.
//     // `done` when the game is over.
//     this.id = this.props.gid;
//     this.action = this.props.gstate;
//
//   }
//
//   render() {
//
//     return (
//
//
//         this.pickComponent()
//
//
//     );
//   }
// }

const GET_GAME = gql`
  {
    games(orderBy: createdAt_DESC, first: 1) {
      id
      question
      createdAt
      duration
      answers {
        id
        myAnswer
        user {
          id
        }
      }
    }
  }
`;



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontWeight: 'bold',
    fontSize: 20
  }
});
