
import React from 'react'
import { StyleSheet, Text, View, Image } from 'react-native'
import {createAppContainer} from 'react-navigation'
import {createBottomTabNavigator} from 'react-navigation-tabs'
import BookTransactionScreen from './Screens/BookTransactionScreen'
import SearchScreen from './Screens/SearchScreen'

export default class App extends React.Component{
  render(){
    return(
      <AppContainer/>
    )
  }
}

const TabNavigator = createBottomTabNavigator({
  transaction:{
    screen:BookTransactionScreen
  },
  search:{
    screen:SearchScreen
  }
})
defaultNavigationOptions:({navigation})=>({
tabBarIcon:({})=>{
  const routeName=navigation.state.routeName
  if(routeName=='transaction'){
    return(
      <Image source = {require('./assets/book (1).png')}
      style={{width:10, height:10}}
      />
    )
  }
  else if(routeName == 'search'){
    return(
      <Image source = {require('./assets/searchingbook.png')}
      style={{width:10, height:10}}
      />
    )
  }
}
})

const AppContainer = createAppContainer(TabNavigator)
