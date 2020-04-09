const Web3 = require('web3');
const keythereum = require('keythereum')
const CryptoJS = require('crypto-js')
const EthereumTx = require('ethereumjs-tx')
const { generateMnemonic, EthHdWallet } = require('eth-hd-wallet')
const nodeProvider = process.env.SERVICE_ETHEREUM_NODE_PROVIDER;

const web3 = new Web3(new Web3.providers.HttpProvider(nodeProvider))


const ethereum =  {}

  ethereum.generateMnemonic = () => {
    let randomMnemonic = generateMnemonic();
    return randomMnemonic;
  }

  ethereum.generateWithMnemonic = sMnemonic => {
    const wallet = EthHdWallet.fromMnemonic(sMnemonic)
    wallet.generateAddresses(1)
    return {
      "publicKey" : wallet.getAddresses()[0],
      "privateKey" : wallet.getPrivateKey(wallet.getAddresses()[0]).toString('hex') 
    }
  }

  ethereum.generate = password => {

    // Initiate empty wallet object
    let wallet = {}
  
    // Generate private key
    let dk = keythereum.create()
  
    // Encrypt private key and collect ciphertext
    let privateKey = dk.privateKey.toString('hex')
    wallet.encryptedKey = CryptoJS.AES.encrypt(privateKey, password).toString()
  
    // Generate address and add '0x' prefix
    let keyObject = keythereum.dump(password, dk.privateKey, dk.salt, dk.iv)
    wallet.address = '0x' + keyObject.address
  
    return wallet
  
  }
  
  ethereum.decryptPrivateKey = (encryptedKey, password) => {
  
    // Decrypt private key and convert it to hex string
    return CryptoJS.AES.decrypt(encryptedKey, password).toString(CryptoJS.enc.Utf8)
  
  }

  ethereum.getBalance = async account => {
    let balance = await web3.eth.getBalance(account.address);
    let balanceEth = web3.utils.fromWei(balance.toString(10));
    return balanceEth;
  }

  ethereum.sendEthereum = async (account, address, amount) => {
    
    // Get nonce
    let nonce = 0
    return await web3.eth.getTransactionCount(account.address)
    .then((count) => {
      nonce = count
      //console.log("Nonce: " + nonce)
    })
    // Get recommended gas price
    .then(() => web3.eth.getGasPrice())
    // Construct transaction
    .then((gasPrice) => {
      // Log gas price
      //console.log("Gas price: " + gasPrice)
      // Convert amount to wei
      amount = web3.utils.toWei(amount, 'ether')
  
      const txParams = {
        nonce: web3.utils.toHex(nonce),
        to: address,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(290000),
        value: web3.utils.toHex(amount),
        chainId: 4
      }
  
      // Log params to console
      //console.log(txParams)
  
      // Create and sign transaction
      const tx = new EthereumTx(txParams)
      tx.sign(Buffer.from(account.privateKey, 'hex'))
  
      // Return serialized transaction data
      return "0x" + tx.serialize().toString('hex')
    })
    // Send transaction and resolve promise chain with Tx Hash
    .then(function(txData) {
      return new Promise((resolve, reject) => {
        web3.eth.sendSignedTransaction(txData)
        .on('transactionHash', (txHash) => resolve(txHash))
        .on('error', (err) => reject(err))
      })
    })
  }

module.exports = ethereum;