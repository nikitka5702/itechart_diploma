import React from 'react'
import ReactDOM from 'react-dom'

import { BrowserRouter } from 'react-router-dom'

import ApolloClient from 'apollo-client'
import { ApolloProvider } from 'react-apollo'
import { createHttpLink } from 'apollo-link-http'
import { ApolloLink, concat } from 'apollo-link'
import { InMemoryCache } from 'apollo-cache-inmemory'

import App from './App'

import './index.css'

const httpLink = createHttpLink({
  uri: '/graphql/',
  credentials: 'same-origin'
})

const authMiddleware = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('token')
  operation.setContext({
    headers: {
      authorization: token ? `JWT ${token}` : '',
    }
  })
  
  return forward(operation);
})

export const client = new ApolloClient({
  link: concat(authMiddleware, httpLink),
  cache: new InMemoryCache(),
  fetchOptions: {
    mode: 'no-cors',
  }
})

const app = (
  <ApolloProvider client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ApolloProvider>
)

ReactDOM.render(app, document.getElementById('root'));
