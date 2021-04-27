import React from 'react'
import {Text,TouchableNativeFeedbackComponent,TouchableOpacity,View,StyleSheet, TextInput, Image, KeyboardAvoidingView, ToastAndroid, Alert} from 'react-native'
import * as Permissions from 'expo-permissions'
import {BarCodeScanner} from 'expo-barcode-scanner'
import db from '../config'
import { TapGestureHandler } from 'react-native-gesture-handler'
import { getPixelSizeForLayoutSize } from 'react-native/Libraries/Utilities/PixelRatio'

export default class BookTransactionScreen extends React.Component{
    constructor(){
        super()
        this.state = {
            hasCameraPermissions:null,
            scannned:false,
            scannedData:"",
            buttonState:'normal',
            scannedbookid:'',
            scannedstudentid:'',
            transactionMessage:""
        }
    }
    getCameraPermissions=async(id)=>{
        const {status}=await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions:status=='granted',
            buttonState:id,
            scanned:false
        })
    }

    handleBarcodeScanned=async({type,data})=>{
        const {buttonState}=this.state
        if(buttonState=='bookid'){
            this.setState({
                scanned:true,
                scannedbookid:data,
                buttonState:'normal'
            })
        }
        else if(buttonState=='studentid'){
            this.setState({
                scanned:true,
                scannedstudentid:data,
                buttonState:'normal'
            })
        }
    }
    initiateBookIssue=async()=>{
        db.collection('Transactions').add({
            'studentid':this.state.scannedstudentid,
            'bookid':this.state.scannedbookid,
            'data':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':'Issue'
        })
        db.collection('Books').doc(this.state.scannedbookid).update({
            'bookAvailability':false
        })
        db.collection('Students').doc(this.state.scannedstudentid).update({
            'bookIssued':firebase.firestore.FieldValue.increment(1)
        })
        this.setState({
            scannedstudentid:"",
            scannedbookid:""
        })
    }

    initiateBookReturn=async()=>{
        db.collection('Transactions').add({
            'studentid':this.state.scannedstudentid,
            'bookid':this.state.scannedbookid,
            'data':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':'Return'
        })
        db.collection('Books').doc(this.state.scannedbookid).update({
            'bookAvailability':true
        })
        db.collection('Students').doc(this.state.scannedstudentid).update({
            'bookIssued':firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({
            scannedstudentid:"",
            scannedbookid:""
        })
    }

    checkBookEligibility=async()=>{
        const bookRef = await db.collection('Books').where('bookid', '==', this.state.scannedbookid).get()
        var transactionType = ""
        if(bookRef.docs.length == 0){
            transactionType = false
        }
        else{
            bookRef.docs.map(doc=>{
                var book = doc.data()
                if(book.bookAvailability){
                    transactionType = 'Issue'
                }
                else{
                    transactionType = 'Return'
                }
            })
        }
        return transactionType
    }

    checkStudentEligibilityForBookIssue=async()=>{
        const studentRef = await db.collection('Students').where('studentid','==',this.state.scannedstudentid).get()
        var isStudentEligible = ""
        if(studentRef.docs.length == 0){
            this.setState({
                scannedstudentid:"",
                scannedbookid:""
            })
            isStudentEligible = false
            Alert.alert('The Student id does not Exist in the Database')
        }
        else{
            studentRef.docs.map(doc=>{
                var student = doc.data()
                if(student.bookIssued<2){
                    isStudentEligible = true
                }
                else{
                    isStudentEligible = false
                    Alert.alert('The Student has already issued 2 Books')
                    this.setState({
                        scannedstudentid:"",
                        scannedbookid:""
                    })
                }
            })
        }
        return isStudentEligible
    }

    checkStudentEligibilityForBookReturn=async()=>{
        const transactionRef = await db.collection('Transactions').where('bookid','==',this.state.scannedbookid).limit(1).get()
        var isStudentEligible = ""
        transactionRef.docs.map(doc=>{
            var lastBookTransaction = doc.data()
            if(lastBookTransaction.studentid == this.state.scannedstudentid){
                isStudentEligible = true
            }
            else{
                isStudentEligible = false
                Alert.alert('The Book was NOT issued by this Student')
                this.setState({
                    scannedbookid:"",
                    scannedstudentid:""
                })
            }
        })
        return isStudentEligible
    }

    handleTransaction=async()=>{
       var transactionType = await this.checkBookEligibility()
       if(!transactionType){
           Alert.alert('The Book does not Exist in the Library Database')
           this.setState({
               scannedstudentid:"",
               scannedbookid:""
           })
       }
       else if(transactionType == 'Issue'){
            var isStudentEligible = await this.checkStudentEligibilityForBookIssue()
            if(isStudentEligible){
                this.initiateBookIssue()
                Alert.alert('Book Issued to the Student')
            }
       }
       else{
           var isStudentEligible = await this.checkStudentEligibilityForBookReturn()
           if(isStudentEligible){
               this.initiateBookReturn()
               Alert.alert('Book Returned to the Library')
           }
       }
    }
    render(){
        const hasCameraPermissions=this.state.hasCameraPermissions
        const scan=this.state.scanned
        const buttonState=this.state.buttonState
        if(buttonState!='normal'&& hasCameraPermissions){
            return(
                <BarCodeScanner
                onBarcodeScanned = {scanned?undefined:this.handleBarcodeScan}
                style = {StyleSheet.absoluteFillObject}
                />
            )
        }
        else if(buttonState=='normal'){
            return(
                <KeyboardAvoidingView style = {styles.container} behaviour="padding" enabled>
                    <View>
                        <Image source = {require("../assets/booklogo.jpg")}
                        style={{width:200, height:200}}/>
                            <Text style = {{textAlign:'center', fontSize:30}}>Wily</Text>
                      
                    </View>
                    <View style = {styles.imputView}>
                        <TextInput style={styles.inputBox}
                        placeholder='bookid'
                        onChangeText = {text=>this.setState({scannedbookid:text})}
                        value={this.state.scannedbookid}
                        />
                        <TouchableOpacity style = {styles.scanButton}
                        onPress={()=>{
                            this.getCameraPermissions('bookid')
                        }}>
                            <Text style = {styles.buttonText}>scan</Text>
                        </TouchableOpacity>
                    </View>

                    <View style = {styles.imputView}>
                        <TextInput style={styles.inputBox}
                        placeholder='studentid'
                        onChangeText = {text=>this.setState({scannedstudentid:text})}
                        value={this.state.scannedstudentid}
                        />
                        <TouchableOpacity style = {styles.scanButton}
                        onPress={()=>{
                            this.getCameraPermissions('studentid')
                        }}>
                            <Text style = {styles.buttonText}>scan</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style = {styles.submitButton}
                        onPress={async()=>{this.handleTransaction()
                        this.setState({
                            scannedbookid:"",
                            scannedstudentid:""
                        })
                        }}
                        >
                            <Text style={styles.submitButtonText}>
                                Submit
                            </Text>
                        </TouchableOpacity>
                </KeyboardAvoidingView>
            )
        }
    }
}

const styles = StyleSheet.create({
    displayText:{
        fontSize:15,
        textDecorationLine:'underline',

    },
    scanButton:{
        backgroundColor:'orange',
        padding:10,
        margin:10,
        width:50,
        borderWidth:1.5,
        borderLeftWidth:0
    },
    buttonText:{
        fontSize:20,
        textAlign:'center',
        marginTop:10
    },
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },
    inputView:{
        flexDirection:'row',
        margin:20
    },
    inputBox:{
        width:200,
        height:40,
        borderWidth:1.5,
        fontSize:20,
        borderRightWidth:0
    },
    submitButton:{
        backgroundColor:'lime',
        width:100,
        height:50
    },
    submitButtonText:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:'turqoise'
    }
   
})

