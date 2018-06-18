import React from 'react';
import { Platform, KeyboardAvoidingView, Button, ScrollView, StyleSheet, Text, View, FlatList, TextInput, AppState } from 'react-native';
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

  state = {}

  _keyExtractor = (item, index) => item.id;

  _renderItem = ({item}) => (
    <MyListItem
      id={item.id}
      myAnswer={item.myAnswer}
    />
  );

  componentDidUpdate(prevProps) {
    console.log("Did update for AnswerListScreen");

  }

  render() {
    console.log("render AnswerListScreen");
    var game = this.props.game;
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>

        <View style={{flex: 1}}>
          {renderQuestion({game})}
        </View>


        <Timer game={game} onCompleted={() => console.log("completed")} />


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

class Timer extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      remaining: timeLeft(this.props.game),
      appState: AppState.currentState
    };
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    AppState.removeEventListener('change', this.handleAppStateChange.bind(this));
  }

  componentDidMount() {

    AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    this.timer = setInterval(() => {
      console.log("tick");
      this.setState({remaining: this.state.remaining-1})
      if(this.state.remaining <= 0) {
        clearInterval(this.timer);
        this.props.onCompleted();
      }

    }, 1000);

  }

  handleAppStateChange(nextAppState) {
    console.log("handleAppStateChange");
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log("updating timer state");
      this.setState({remaining: timeLeft(this.props.game)});
    }
    this.setState({appState: nextAppState});

  }

  render() {
    var seconds = this.state.remaining % 60;
    var minutes = Math.floor(this.state.remaining / 60);
    if(this.state.remaining <= 0) {
      return (null);
    }
    return (
      <View style={{flex: 1, backgroundColor: 'cyan', margin: 5}}>
        <View style={{flex: 1, flexDirection: 'column', margin: 5}}>
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
    myAnswer
    user {
      id
    }
  }
}
`;

class WrapperKeyboardAvoider extends React.Component {
  render() {
    if(Platform.OS === 'ios') {
      return (
        <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
          {this.props.children}
        </KeyboardAvoidingView>
      );
    }
    return (
      this.props.children
    );
  }
}

export class SubmitAnswerScreen extends React.Component {

  constructor(props) {
    super(props);

    this.state = {text: '', completed: false}

    console.log("SubmitAnswerScreen: game = ", this.props.game);
  }

  render() {
    console.log("render SubmitAnswerScreen");
    if(this.state.completed) {
      return <View style={{flex:1, alignItems: 'center', justifyContent: 'center'}}><Text>Loading Answers</Text></View>
    }
    return (
      <View style={{flex: 4}}>
        <Mutation
          mutation={CREATE_ANSWER}
          onCompleted={() => this.setState({completed: true})}
          update={(cache, { data: { createAnswer } }) => {
            console.log("createAnswer = ", createAnswer);
            var game = this.props.game;
            var newGame = {...game, answers: this.props.game.answers.concat([createAnswer])};
            console.log("answers = ", this.props.game.answers.concat([createAnswer]));
            console.log("newGame = ", newGame);
            // cache.writeQuery({ query: GET_ONE_GAME, variables: {id: this.props.game.id}, data: {game: newGame} });
            cache.writeQuery({ query: GET_GAME, data: {games: [newGame]} });
            console.log("updated my answer");
          }}
        >
          {(createAnswer, {data}) => {
            return (
              <View style={{flex:1}}>

              <WrapperKeyboardAvoider>

                {renderQuestion({game: this.props.game})}

                <Timer game={this.props.game} onCompleted={() => this.setState({completed: true})} />

                <View style={{backgroundColor: 'white', flex: 1, margin: 5}}>
                  <TextInput
                    multiline = {true}
                    numberOfLines = {4}
                    maxLength = {200}
                    onChangeText={(text) => this.setState({text})}
                    value={this.state.text}
                    placeholder={"Your Answer"}
                  />

                </View>
                <View style={{flex:1}}>
                  <Button
                    title={"Submit"}
                    onPress={() => {
                      createAnswer({variables: {userID: this.props.currentUser.id, gameID: this.props.game.id, myAnswer: this.state.text}});
                    }}
                  />
                </View>

              </WrapperKeyboardAvoider>

              </View>
            );}}
        </Mutation>
      </View>
    );
  }
}

const timeLeft = (game) => {
  var date = new Date(game.createdAt);
  console.log("before date: ", date);
  date.setMinutes(date.getMinutes() + game.duration);
  var res = (Math.floor((date - (new Date())) / 1000));
  console.log("Time left = ", res);
  return res;
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
      <View style={{flex:1, backgroundColor: 'silver'}}>
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
          var game = data.games && data.games.length > 0 ? data.games[0] : null;
          console.log("game = ", game);
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


const GET_ONE_GAME = gql`
query game($id: ID!) {
  game(where:{id: $id}) {
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
