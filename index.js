const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const { MongoClient } = require('mongodb');
const axios = require('axios');
const {parse, stringify, toJSON, fromJSON} = require('flatted');
// import "reflect-metadata";
const ImageKit = require('imagekit');
const ObjectId = require('mongodb').ObjectID
require('dotenv').config();

const app = express()
app.use(express.static('categories'))
// app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload({
    createParentPath: true
  }));
//   const cors = require('cors');
  app.use(cors({
      origin: '*'
  }));

const imagekit = new ImageKit({
    urlEndpoint: 'https://ik.imagekit.io/ebnirpt9i8agxu',
    publicKey: 'public_5rRmOCN1vK/MI28l98iNzt8jNhQ=',
    privateKey: 'private_zhGSwTmOLTaSGUBkrvsduQ1ln1s='
});

app.get('/', (req, res) => {
    res.send('everything is ok here after change 3')
})
app.get('/new', (req, res) => {
    res.send('new')
})

app.get('/auth', function (req, res) {
    var result = imagekit.getAuthenticationParameters();
    res.send(result);
});


const uri = `mongodb+srv://Bandhon_Ecommerce:Noor&62427@cluster0.zcphb.mongodb.net/badhon_ecommerce?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser: true })


client.connect(error => {
    // console.log(error)
    const categoryCollection = client.db("bandhon_ecommerce").collection("categories")
    const developersCollection = client.db("bandhon_ecommerce").collection("developers")

    // app.get('/get', (req, res) => {
    //     categoryCollection.find({})
    //     .toArray((err, docs) => {
    //         res.send([{message: error}])
    //         console.log(err)
    //     })
    // })

    app.get('/get-categories', (req, res) => {
        categoryCollection.find({})
        .toArray((err, docs) => {
            res.send(docs)
        })
    })

    app.patch('/add-brand/id',(req, res)=>{
        const id = req.query.id;
        const body = req.body;
        categoryCollection.updateOne(
            { _id: ObjectId(id) },
            {
              $set: {brands: body.brands},
            }
        )
        .then(result =>  res.send(result))
        .catch(err => console.log(err))
    })

    app.patch('/add-product/id',(req, res)=>{
        const id = req.query.id;
        const body = req.body;
        console.log(body)
        categoryCollection.updateOne(
            { _id: ObjectId(id) },
            {
            $set: {products: body.products},
            }
        )
        .then(result =>  res.send(result))
        .catch(err => console.log(err))
    })

    const userDataCollection = client.db("bandhon_ecommerce").collection("user_data")
    const adminDataCollection = client.db("bandhon_ecommerce").collection("admin_mail")
    const requestedProductsCollection = client.db("bandhon_ecommerce").collection("requested_products")

    // app.get('/get-admin-mail', (req, res) => {
    //     adminDataCollection.find({})
    //     .toArray((err, docs) => {
    //         res.send(docs)
    //         console.log(err)
    //     })
    // })

    app.get('/get-user-data/id', (req, res) => {
        const id = req.query.id;
        userDataCollection.find({})
        .toArray((err, docs) => {
            // var adminData = []
            var userData = docs.find(user => user.uid === id)
            if(userData){
                adminDataCollection.find({})
                .toArray((err, docs) => {
                    if(userData.email){
                        var admin = docs.find(data => data.email === userData.email)
                        // console.log(adminData)
                        if(admin){
                            userData.admin = true
                            res.send(userData)
                        }
                        else{
                            res.send(userData)
                        }
                    }
                    else{
                        res.send(userData)
                    }
                })
            }
            else{
                res.send({error: 'no data found'})
            }
            
        })
    })

    app.post('/add-user-data', (req, res) => {
        const data = req.body
        // console.log(data, 'data')
        userDataCollection.insertOne(data)
        .then(result => {
            res.send(result.ops[0])
        })
        .catch(err => console.log(err))
    })

    app.post('/upload-profile-image/id', (req, res) => {
        const data = req.body
        const image = data.image
        const uid = data.uid
        stringify(image)
        stringify(uid)
        console.log(data)
        // const id = req.query.id

        // userDataCollection.find({})
        // .toArray((err, docs) => {
        //     const selectedUser = docs.find(user => user._id === id)
        //     selectedUser.image = data.image
        // })
        // console.log(data, id)
        userDataCollection.updateOne(
            {_id: ObjectId(uid)},
            {
                $set: {image: image}
            }
        )
        .then(result => res.send(result))
        .then(err => res.send(err))
    })

    app.patch('/add-cart-product/id', (req, res)=>{
        const id = req.query.id;
        const body = req.body;
        // console.log(body, id)
        userDataCollection.updateOne(
            { _id: ObjectId(id) },
            {
            $set: {cartProducts: body},
            }
        )
        .then(result =>  res.send(result))
        .catch(err => res.send(err))
    })

    app.patch('/buy-products/id', (req, res) => {
        const id = req.query.id
        const data = req.body
        // console.log(id, data)
        userDataCollection.find({})
        .toArray((err, users) => {
            const selectedUser = users.find(user => user.uid === data.uid)
            if(selectedUser.boughtProducts) {
                userDataCollection.updateOne(
                    {_id: ObjectId(data.userMDBId)},
                    {
                        $set: {boughtProducts: [...selectedUser.boughtProducts ,data]}
                    }
                )
                requestedProductsCollection.insertOne(data)
                .then(result => {
                    // res.send(result)
                    userDataCollection.updateOne(
                        {_id: ObjectId(data.userMDBId)},
                        {
                            $set: {cartProducts: []}
                        }
                    )
                    res.send({success: true})
                })
                .catch(err => {
                    console.log(err)
                })
            }
            else {
                userDataCollection.updateOne(
                    {_id: ObjectId(data.userMDBId)},
                    {
                        $set: {boughtProducts: [data]}
                    }
                )
                requestedProductsCollection.insertOne(data)
                .then(result => {
                    // res.send(result)
                    userDataCollection.updateOne(
                        {_id: ObjectId(data.userMDBId)},
                        {
                            $set: {cartProducts: []}
                        }
                    )
                    res.send({success: true})
                })
                .catch(err => {
                    console.log(err)
                })
            }
        })
        // requestedProductsCollection.insertOne(data)
        // .then(result => {
        //     console.log(result)
        // })
        // .catch(err => {
        //     console.log(err)
        // })
    })

    app.get('/get-profile-data/id', (req, res) => {
        const id = req.query.id
        userDataCollection.find({})
        .toArray((err, docs) => {
            const selectedUser = docs.find(user => user.uid === id)
            let newData = {...selectedUser}
            delete newData.password
            newData.isSignedIn = true
            res.send(newData)
        })
    })

    app.get('/get-requested-products', (req, res) => {
        requestedProductsCollection.find({})
        .toArray((err, docs) => {
            console.log(docs)
            res.send(docs)
        })
    })

    app.post('/change-status', (req, res) => {
        const data = req.body
        userDataCollection.find({})
        .toArray((err, docs) => {
            const selectedUserID = docs.find(userData => userData.uid === data.uid)._id
            const selectedUsersProducts = docs.find(userData => userData.uid === data.uid).boughtProducts
            const getIndex = selectedUsersProducts.findIndex(product => product._id == data.id)
            selectedUsersProducts[getIndex].status = 'success'

            userDataCollection.updateOne(
                {_id: ObjectId(selectedUserID)},
                {
                    $set: {boughtProducts: selectedUsersProducts}
                }
            )
            requestedProductsCollection.find({})
            .toArray((err2, docs2) => {
                const selectedRequestedProduct = docs2.find(product2 => product2.transactionId === data.transactionId)

                requestedProductsCollection.updateOne(
                    {_id: ObjectId(selectedRequestedProduct._id)},
                    {
                        $set: {status: 'success'}
                    }
                )
                
                res.send({success: true})
            })
        })
    })

    app.post('/add-developer', (req, res) => {
        const data = req.body
        developersCollection.insertOne(data)
        .then(result => {
            res.send(result)
        })
        .catch(err => console.log(err))
    })

    app.get('/get-developers-data', (req, res) => {
        developersCollection.find({})
        .toArray((err, docs) => {
            res.send(docs)
        })
    })

    const luckyWinnerCollection = client.db("bandhon_ecommerce").collection("lucky_winner_data")

    app.get('/get-lucky-winner-data', (req, res) => {
        luckyWinnerCollection.find({})
        .toArray((err, docs) => {
            res.send(docs)
            console.log(err)
        })
    })

    app.post('/add-lucky-winner-data', (req, res) => {
        const data = req.body
        luckyWinnerCollection.insertOne(data)
        .then(result => {
          res.send(result)
        })
        .catch(err => console.log(err))
    })

    const campaignCollection = client.db("bandhon_ecommerce").collection("campaign")
    const hotDealSalePendingCollection = client.db("bandhon_ecommerce").collection("hot_deal_sale_pending")

    app.get('/get-campaign-data', (req, res) => {
        campaignCollection.find({})
        .toArray((err, docs) => {
            res.send(docs)
            console.log(err)
        })
    })

    app.patch('/add-campaign-product/id', (req, res)=>{
        const id = req.query.id;
        const body = req.body;
        campaignCollection.updateOne(
            { _id: ObjectId(id) },
            {
            $set: {products: body},
            }
        )
        .then(result =>  res.send(result))
        .catch(err => res.send(err))
    })

    // register new user 
    app.post('/register-new-user', (req, res) => {
        const data = req.body;
        userDataCollection.find({})
        .toArray((err, docs) => {
            var alreadyRegistered = docs.find(doc => doc.email === data.email)
            if(alreadyRegistered) {
                res.send({error: 'This email is already registered.'})
            }
            else {
                userDataCollection.insertOne(data)
                .then(result => {
                    res.send(result.ops)
                })
                .catch(err => res.send({error: err.message}))
            }
        })
    })

    // email pass login 
    app.post('/email-pass-login', (req, res) => {
        const data = req.body
        userDataCollection.find({})
        .toArray((err, docs) => {
            var selectedUser = docs.find(user => user.email === data.email)
            if(selectedUser) {
                if(selectedUser.password) {
                    if(selectedUser.password === data.password) {
                        var newData = selectedUser
                        delete newData.password
                        newData.isSignedIn = true
                        console.log(newData, "user")
                        res.send({status: 'success', data: newData});
                    }
                    else {
                        res.send({error: 'Password did not match.'})
                    }
                }
                else {
                    res.send({error: 'There is no account with this method.'})
                }
            }
            else {
                res.send({error: 'No user found with this email.'})
            }
        })
    })

    const campaignDataCollection = client.db("bandhon_ecommerce").collection("campaign_data")

    // calling sManager payment gateway api
    // app.post('/call-payment-gateway', (req, res) => {
    //     const client_id = '721182060'
    //     const client_secret = 'p3PO1ZmZWMM4msFBEubuwD2lTSQvXdu8zDIh2jJLfqjz9zTXJotl86JO6wHRck5zO6edx1KdML2XQkfu57r1a2s84jPIfdJYglebLnPWDFacDt9e4K1tHozd'
    //     var data = req.body;

    //     var config = {
    //     method: 'post',
    //     url: 'https://api.sheba.xyz/v1/ecom-payment/initiate',
    //     headers: { 
    //         'client-id': client_id,
    //         'client-secret': client_secret,
    //         'Accept': 'application/json', 
    //         'Content-Type': 'application/json'
    //     },
    //         data : data
    //     };

    //     axios(config)
    //     .then(function (response) {
    //         res.send(response.data);
    //     })
    //     .catch(function (error) {
    //         res.send(error);
    //     });
    // })

    // to add the data in campaign sale pending database
    const campaignSalePendingCollection = client.db("bandhon_ecommerce").collection("campaign_sale_pending")
    const salePendingCollection = client.db("bandhon_ecommerce").collection("product_sale")
    const hotDealDataCollection = client.db("bandhon_ecommerce").collection("hot_deal_data")

    // getting payment details from sManager
    app.post('/add-payment-details', (req, res) => {
        var paymentData = req.body;
        paymentData.status = 'pending'

        salePendingCollection.insertOne(paymentData)
        .then(result => {
            console.log(result, "inserted result")
            if(result.insertedCount !== 0) {
                userDataCollection.find({})
                .toArray((err, docs) => {
                    var selectedUser = docs.find(user => user.uid === paymentData.uid);
                    if(selectedUser.productBought){
                        selectedUser.productBought = [...selectedUser.productBought, paymentData]
                        userDataCollection.updateOne(
                            { _id: ObjectId(selectedUser._id) },
                            {
                                $set: {productBought: selectedUser.productBought}
                            }
                        )
                        .then(result => {
                            res.send(result)
                        })
                        .catch(error => console.error(error))
                    }
                    else{
                        selectedUser.productBought = [paymentData]
                        userDataCollection.updateOne(
                            { _id: ObjectId(selectedUser._id) },
                            {
                                $set: {productBought: selectedUser.productBought}
                            }
                        )
                        .then(result => {
                            res.send(result)
                        })
                        .catch(error => console.error(error))
                    }
                })
            }
            else{
                res.send({error: 'Can not insert data please reload the page.'})
            }
        })
        .catch(err => console.log(err));
    })

    // getting campaign payment details from sManager
    app.post('/add-campaign-payment-details', (req, res) => {
        var campaignPaymentData = req.body;
        campaignDataCollection.find({})
        .toArray((err, docs) => {
            var CPCategoryData = docs.find(category => category.name === campaignPaymentData.productDetails.productCategory)
            var addNewData = {...campaignPaymentData}
            if(CPCategoryData.data){
                addNewData.code = parseInt(CPCategoryData.data[CPCategoryData.data.length - 1].code) + 1
                campaignDataCollection.updateOne(
                    { _id: ObjectId(CPCategoryData._id) },
                    {
                    $set: {data: [...CPCategoryData.data, addNewData]},
                    }
                )
                .then(result => {
                    userDataCollection.find({})
                    .toArray((err, docs) => {
                        const userData = docs.find(user => user._id == campaignPaymentData.userId)
                        if(userData.campaignProducts) {
                            addNewData.status = "pending"
                            userDataCollection.updateOne(
                                { _id: ObjectId(userData._id) },
                                {
                                $set: {campaignProducts: [...userData.campaignProducts, addNewData]},
                                }
                            )
                            .then(result => {
                                campaignSalePendingCollection.insertOne(addNewData)
                                .then(result => {
                                    res.send(result)
                                })
                                .catch(err => res.send(err))
                            })
                            .catch(err => res.send(err));
                        }
                        else {
                            addNewData.status = "pending"
                            userDataCollection.updateOne(
                                { _id: ObjectId(userData._id) },
                                {
                                $set: {campaignProducts: [addNewData]},
                                }
                            )
                            .then(result => {
                                campaignSalePendingCollection.insertOne(addNewData)
                                .then(result => {
                                    res.send(result)
                                })
                                .catch(err => res.send(err))
                            })
                            .catch(err => res.send(err));
                        }
                    })
                })
                .catch(err => res.send(err))
            }
            else{
                addNewData.code = 2021
                campaignDataCollection.updateOne(
                    { _id: ObjectId(CPCategoryData._id) },
                    {
                    $set: {data: [addNewData]},
                    }
                )
                .then(result => {
                    userDataCollection.find({})
                    .toArray((err, docs) => {
                        const userData = docs.find(user => user._id == campaignPaymentData.userId)
                        if(userData.campaignProducts) {
                            addNewData.status = "pending"
                            userDataCollection.updateOne(
                                { _id: ObjectId(userData._id) },
                                {
                                $set: {campaignProducts: [...userData.campaignProducts, addNewData]},
                                }
                            )
                            .then(result => {
                                campaignSalePendingCollection.insertOne(addNewData)
                                .then(result => {
                                    res.send(result)
                                })
                                .catch(err => res.send(err))
                            })
                            .catch(err => res.send(err));
                        }
                        else {
                            addNewData.status = "pending"
                            userDataCollection.updateOne(
                                { _id: ObjectId(userData._id) },
                                {
                                $set: {campaignProducts: [addNewData]},
                                }
                            )
                            .then(result => {
                                campaignSalePendingCollection.insertOne(addNewData)
                                .then(result => {
                                    res.send(result)
                                })
                                .catch(err => res.send(err))
                            })
                            .catch(err => res.send(err));
                        }
                    })
                })
                .catch(err => res.send(err))
            }
        })
    })

    // getting hot-deal payment details from sManager
    app.post('/add-hot-deal-payment-details', (req, res) => {
        var hotDealPaymentData = req.body;
        console.log(hotDealPaymentData)
        var newPaymentData = {...hotDealPaymentData}

        // checking saleId
        hotDealSalePendingCollection.find({})
        .toArray((err, docs) => {
            if(docs.length > 0) {
                newPaymentData.SLID = docs[docs.length - 1].SLID + 1
            }
            else {
                newPaymentData.SLID = 3001
            }
        })

        userDataCollection.find({})
        .toArray((err, data) => {
            var selectedUser = data.find(user => user._id == newPaymentData.userId)
            if(selectedUser){
                hotDealSalePendingCollection.insertOne(newPaymentData)
                .then(result => {
                    if(result.insertedCount === 1){
                        if(selectedUser.hotDealData){
                            userDataCollection.updateOne(
                                { _id: ObjectId(newPaymentData.userId) },
                                {
                                $set: {hotDealData: [...selectedUser.hotDealData, newPaymentData]},
                                }
                            )
                            .then(result => {
                                res.send(result)
                            })
                            .catch(err => res.send({error: err}));
                        }
                        else{
                            userDataCollection.updateOne(
                                { _id: ObjectId(newPaymentData.userId) },
                                {
                                $set: {hotDealData: [newPaymentData]},
                                }
                            )
                            .then(result => {
                                res.send(result)
                            })
                            .catch(err => res.send({error: err}));
                        }
                    }
                    else{
                        res.send({error: 'Something went wrong saving your data. Please refresh the page to fix the issue.'})
                    }
                })
                .catch(err => res.send({error: err}))
            }
            else{
                res.send({error: 'Something went wrong finding the user. Please refresh the page.'})
            }
        })
    })


    // adding data in hot deal data collection
    app.post('/add-hot-deal-data', (req, res) => {
        var data = req.body
        hotDealDataCollection.insertOne(data)
        .then(result => {
            res.send(result)
        })
        .catch(err => res.send(err))
    })

    // getting all hot deal data
    app.get('/get-all-hot-deal-data', (req, res) => {
        hotDealDataCollection.find({})
        .toArray((err, docs) => {
            res.send(docs)
        })
    })

    // adding hot-deal cash-on-delivery data
    app.post('/hot-deal-cash-on-delivery', (req, res) => {
        var data = req.body
        // console.log('data', data)
        userDataCollection.find({})
        .toArray((err, docs) => {
            var selectedUser = docs.find(user => user._id == data.userId)
            if(selectedUser){
                hotDealSalePendingCollection.insertOne(data)
                .then(result => {
                    if(selectedUser.hotDealData) {
                        userDataCollection.updateOne(
                            { _id: ObjectId(data.userId) },
                            {
                            $set: {hotDealData: [...selectedUser.hotDealData, data]},
                            }
                        )
                        .then(result => {
                            res.send(result)
                        })
                        .catch(err => res.send({error: err}));
                    }
                    else{
                        userDataCollection.updateOne(
                            { _id: ObjectId(data.userId) },
                            {
                            $set: {hotDealData: [data]},
                            }
                        )
                        .then(result => {
                            res.send(result)
                        })
                        .catch(err => res.send({error: err}));
                    }
                })
                .catch(err => res.send({error: err}));
            }
        })
    })

})

app.listen(process.env.PORT || 5000)