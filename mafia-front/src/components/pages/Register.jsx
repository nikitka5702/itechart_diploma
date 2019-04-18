import React, { Component } from 'react'
import { Formik, Form } from 'formik'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import * as Yup from 'yup'

import MaterializeField from '../MaterializeField'

const CREATE_USER = gql`
mutation CreateUser($username: String!, $email: String!, $password: String!) {
  createUser(username: $username, email: $email, password: $password) {
    user {
      id
    }
  }
}`

const SignupSchema = Yup.object().shape({
  username: Yup.string()
    .min(4, 'Too short')
    .max(50, 'Too long')
    .required('Required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Required'),
  password: Yup.string()
    .required('Password required'),
  passwordConfirm: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required')
})

export default class Register extends Component {
  render() {
    return (
      <div className="content">
        <div className="col s8 offset-s2">
        <Mutation 
            mutation={CREATE_USER}
            update={(cache, { data: { createUser: { user: { id } } } }) => {
              console.log(id)
              this.props.history.push('/login')
            }}
          >
            {(createUser, { data }) => (
              <Formik
                initialValues={{username: '', email: '', password: '', passwordConfirm: ''}}
                validationSchema={SignupSchema}
                onSubmit={(values, actions) => {
                  const {username, email, password} = values
                  createUser({variables: {username, email, password}})
                }}
                render={({ errors, status, touched, isSubmitting }) => (
                  <Form>
                    <div className="row">
                      <div className="col s8 offset-s2">
                        <div className="row">
                          <div className="col s6">
                          <MaterializeField type="text" name="username" component="p" title="Username" />
                          </div>
                          <div className="col s6">
                            <MaterializeField type="text" name="email" component="p" title="Email" />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col s6">
                            <MaterializeField type="password" name="password" component="p" title="Password" />
                          </div>
                          <div className="col s6">
                            <MaterializeField type="password" name="passwordConfirm" component="p" title="Password Confirm" />
                          </div>
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
