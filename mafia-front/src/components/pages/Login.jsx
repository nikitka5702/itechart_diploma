import React, { Component } from 'react'
import { Formik, Form } from 'formik'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import * as Yup from 'yup'

import MaterializeField from '../MaterializeField'

const TOKEN_AUTH = gql`
mutation TokenAuth($username: String!, $password: String!) {
  tokenAuth(username: $username, password: $password) {
    token
  }
}`

const SigninSchema = Yup.object().shape({
  username: Yup.string()
    .min(4, 'Too short')
    .max(50, 'Too long')
    .required('Required'),
  password: Yup.string()
    .required('Password required'),
})

export default class Login extends Component {
  render() {
    return (
      <div className="content">
        <div className="col s8 offset-s2">
          <Mutation 
            mutation={TOKEN_AUTH}
            update={(cache, { data: { tokenAuth } }) => {
              const { token } = tokenAuth
              localStorage.setItem('token', token)
              this.props.history.push('/')
            }}
          >
            {(tokenAuth, { data }) => (
              <Formik
                initialValues={{username: '', password: ''}}
                validationSchema={SigninSchema}
                onSubmit={(values, actions) => {
                  const {username, password} = values
                  tokenAuth({variables: {username, password}})
                }}
                render={({ errors, status, touched, isSubmitting }) => (
                  <Form>
                    <div className="row">
                      <div className="col s8 offset-s2">
                        <div className="row">
                          <MaterializeField type="text" name="username" component="p" title="Username" />
                        </div>
                        <div className="row">
                          <MaterializeField type="password" name="password" component="p" title="Password" />
                        </div>
                        <button type="submit" className="btn" disabled={isSubmitting}>Submit</button>
                      </div>
                    </div>
                  </Form>
                )}
              />
            )}
          </Mutation>
        </div>
      </div>
    )
  }
}
