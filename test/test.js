const tape = require('tape')
const utils = require('ethereumjs-util')
const rlp = utils.rlp
const PrivateTransaction = require('../src/privateTransaction.js')
const txFixtures = require('./txs.json')
tape('[Transaction]: Basic functions', function (t) {
    let transactions = [];

    t.test('should decode transactions', function (st) {
        txFixtures.slice(0, 3).forEach(function (tx) {
            let pt = new PrivateTransaction(tx.raw)
            st.equal('0x' + pt.nonce.toString('hex'), tx.raw[0])
            st.equal('0x' + pt.gasPrice.toString('hex'), tx.raw[1])
            st.equal('0x' + pt.gasLimit.toString('hex'), tx.raw[2])
            st.equal('0x' + pt.to.toString('hex'), tx.raw[3])
            st.equal('0x' + pt.value.toString('hex'), tx.raw[4])
            st.equal('0x' + pt.data.toString('hex'), tx.raw[5])
            st.equal('0x' + pt.v.toString('hex'), tx.raw[6])
            st.equal('0x' + pt.r.toString('hex'), tx.raw[7])
            st.equal('0x' + pt.s.toString('hex'), tx.raw[8])
            st.equal(pt.privateFrom.toString(), tx.raw[9])
            for (let i = 0; i < tx.raw[10].length; i++) {
                st.equal(pt.privateFor[i].toString(), tx.raw[10][i])
            }
            st.equal(pt.restriction.toString(), tx.raw[11])
            transactions.push(pt)
        })
        st.end()
    })

    t.test('should decode rlp', function (st) {
        transactions.forEach(function (tx, i) {
            if (txFixtures[i].rlp) {
                st.deepEqual(transactions[i].serialize(), new PrivateTransaction(txFixtures[i].rlp).serialize())
            }
        })

        st.end()
    })

    t.test('should serialize', function (st) {
        transactions.forEach(function (tx) {
            st.deepEqual(tx.serialize(), rlp.encode(tx.raw))
        })
        st.end()
    })

    t.test('should sign tx', function (st) {
        transactions.forEach(function (tx, i) {
            if (txFixtures[i].privateKey) {
                var privKey = new Buffer(txFixtures[i].privateKey, 'hex')
                tx.sign(privKey)
            }
        })
        st.end()
    })

    t.test("should get sender's address after signing it", function (st) {
        transactions.forEach(function (tx, i) {
            if (txFixtures[i].privateKey) {
                st.equals(tx.getSenderAddress().toString('hex'), txFixtures[i].sendersAddress)
            }
        })
        st.end()
    })

    t.test("should get sender's public key after signing it", function (st) {
        transactions.forEach(function (tx, i) {
            if (txFixtures[i].privateKey) {
                st.equals(tx.getSenderPublicKey().toString('hex'),
                    utils.privateToPublic(new Buffer(txFixtures[i].privateKey, 'hex')).toString('hex'))
            }
        })
        st.end()
    })
})