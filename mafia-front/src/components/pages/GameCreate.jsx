import React, { Component } from 'react'
import MaterializeField from '../MaterializeField'
import { Formik, Form } from "formik";
import {Mutation} from "react-apollo";

const TOKEN_AUTH = gql`
mutation TokenAuth($username: String!, $password: String!) {
  tokenAuth(username: $username, password: $password) {
    token
  }
}`

export default class GameCreate extends Component {
  render() {
    return (
      <div className="container">
          <Mutation mutation={TOKEN_AUTH}
                    variables={} optimisticResponse={}
                    refetchQueries={} awaitRefetchQueries={}
                    update={} onCompleted={} onError={} fetchPolicy={}></Mutation>
        <Formik
          initialValues={{numberPlayers: 8}}
          render={
            ({ errors, status, touched, isSubmitting }) =>
              (
                <Form>
                  <div className="">
                    <MaterializeField type="text" name="roomName" title="name of room" component="p"/>
                    <MaterializeField type="password" name="password" title="password of room" component="p"/>
                    <MaterializeField type="number" name="numberPlayers" title="number of players" component="p"/>
                    <button type="submit" className="btn" disabled={isSubmitting}>Create</button>
                  </div>
                </Form>
              )
          }
        >
        </Formik>
      </div>
        )
    }
}
