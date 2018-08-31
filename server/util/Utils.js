'use strict'
const app = require('../server')
// const util = require('')
const AccessToken = app.models.AccessToken;
const agency = app.models.agency;
const loan = app.models.loan;
const host = app.models.host;
const investor = app.models.investor;
const lend = app.models.lending;
const interest = app.models.interest;
const wallet = app.models.wallet;
const constant = require('../constant')
const Q = require('q')
const interest_loan = app.models.interes_loan;
exports.checkToken = (token) =>
    new Promise((resolve, reject) => {
        AccessToken.findById(token)
            .then(result => {
                if (result != null)
                    resolve(result)
                else {
                    reject("token not found")
                }
            })
            .catch(err => {
                reject(err);
            })
    })

exports.checkToken1 = (token) =>
    new Promise((resolve, reject) => {
        AccessToken.findOne({ where: { id: token } })
            .then(result => {
                if (result != null)
                    resolve(result)
                else {
                    reject("token not found")
                }
            })
            .catch(err => {
                reject(err);
            })
    })
var convertLoan = (loanId) =>
    new Promise((resolve, reject) => {
        var loanTemp;
        loan.findById(loanId)
            .then(loan => {
                loanTemp = loan;
                return host.findById(loan.hostId)
                console.log('loanTemp.amount', loanTemp.amount)
                console.log('loanTemp.called', loanTemp.called)
            })
            .then(host => {
                var result = {
                    id: loanTemp.id,
                    avatar: loanTemp.avatar,
                    name: loanTemp.name,
                    type: loanTemp.typeHome,
                    description: loanTemp.descriptions,
                    distanceCenter: loanTemp.distanceCenter,
                    distanceMainRoad: loanTemp.distanceMainRoad,
                    distanceDiffHomestay: loanTemp.distanceDiffHomestay,
                    money: loanTemp.amount,
                    called: parseFloat(((loanTemp.called / loanTemp.amount) * 100).toFixed(0)),
                    address: host.address,
                    due_date: loanTemp.start_time,
                    range_time: loanTemp.range_time,
                    interest: loanTemp.interest,
                    list_photos: loanTemp.photos
                }
                resolve(result)
            })
            .catch(err => {
                reject(err)
            })
    })
exports.convertLoan = convertLoan;
var exchangeMoneyWithoutToken = (receiveId, sendId, amount) =>
    new Promise((resolve, reject) => {
        var receiveWallet, sendWallet;
        wallet.findOne({ where: { ownerId: sendId } })
            .then(wallets => {
                sendWallet = wallets;
                return wallet.findOne({ where: { ownerId: receiveId } })
            })
            .then(wallet => {
                receiveWallet = wallet;
                if (sendWallet.balance < amount) {
                    reject('not enough money')
                } else {
                    var balanceSend = sendWallet.balance * 1000000;
                    var addSub = amount * 1000000;
                    var balanceReceive = receiveWallet.balance * 1000000;

                    sendWallet.balance = parseFloat(((balanceSend - addSub) / 1000000).toFixed(2));
                    receiveWallet.balance = parseFloat(((balanceReceive + addSub) / 1000000).toFixed(2));
                    sendWallet.save(err => {
                        if (err) {
                            reject(err)
                        }
                    });
                    receiveWallet.save(err => {
                        if (err) {
                            reject(err)
                        }
                    });
                }
                resolve("success")
            })
            .catch(err => {
                reject(err);
            })
    })
var chageMoney = (sendId, receiveId, amount) =>
    new Promise((resolve, reject) => {
        var receiveWallet, sendWallet;
        wallet.findOne({ where: { ownerId: sendId } })
            .then(wallets => {
                sendWallet = wallets;
                console.log('receiveId : ', receiveId)
                return wallet.findOne({ where: { ownerId: receiveId } })
            })
            .then(wallet => {
                receiveWallet = wallet;
                console.log('utilsWallet', receiveWallet)
                if (sendWallet.balance < amount) {
                    reject('not enough money')
                } else {
                    var balanceSend = sendWallet.balance * 1000000;
                    var addSub = amount * 1000000;
                    var balanceReceive = receiveWallet.balance * 1000000;

                    sendWallet.balance = parseFloat(((balanceSend - addSub) / 1000000).toFixed(2));
                    receiveWallet.balance = parseFloat(((balanceReceive + addSub) / 1000000).toFixed(2));
                    sendWallet.save(err => {
                        if (err) {
                            console.log('send errorr')
                            reject(err)
                        }
                    });
                    receiveWallet.save(err => {
                        if (err) {
                            console.log('receiveId error')
                            reject(err)
                        }
                    });
                }
                resolve("success")
            })
            .catch(err => {
                reject(err);
            })
    })
exports.chageMoney = chageMoney;
exports.reCallAllMoneyOfLoan = (loanId) =>
    new Promise((resolve, reject) => {
        var hostTemp;
        var promises = [];
        loan.findById(loanId)
            .then(loan => {
                return host.findById(loan.hostId)
            })
            .then(host => {
                hostTemp = host;
                return lend.find({ where: { loanId: loanId } })
            })
            .then(lends => {
                if (lends == null || lends.length == 0) {
                    resolve("success")
                }
                console.log('lends', lends)
                lends.forEach(lend => {
                    promises.push(investor.findById(lend.investorId)
                        .then(investor => {
                            return exchangeMoneyWithoutToken(investor.id, constant.ID_SYSTEM, lend.amount)
                        })
                        .catch(err => {
                            console.log('errrdsf ', err)
                            reject(err)
                        })
                    )
                    Q.all(promises)
                        .then(result => {
                            console.log('success dfdafdf')
                            resolve("success")
                        })
                })

            })
            .catch(err => {
                console.log('errrdsf12 ', err)
                reject(err)
            })
    })
exports.convertInvestor = (investors) =>
    new Promise((resolve, reject) => {
        var result = [];
        var total = 0;
        var promises = [];
        investors.forEach(investor => {
            promises.push(lend.find({ where: { investorId: investor.id } })
                .then(lends => {
                    if (lends.length == 0) {
                        resolve({ result: [] });
                    } else {
                        lends.forEach(lend => {
                            total += lend.amount;
                        })
                    }
                    result.push({
                        name: investor.name,
                        lended_money: total,
                        avatar: investor.avatar
                    })
                })
                .catch(err => {
                    reject(err);
                })
            )

        })
        Q.all(promises)
            .then(() => {
                resolve({ result: result })
            })
            .catch(err => {
                reject(err);
            })

    })
exports.convertLoans = (loans) =>
    new Promise((resolve, reject) => {
        var promises = [];
        for (var i = 0; i < loans.length; i++) {
            promises.push(util.convertLoan(loans[i].id)
                .then(loanHost => {
                    listLoan.push(loanHost)
                })
            )
        }
        Q.all(promises)
            .then(() => {
                var data = {
                    list_loan: listLoan,
                    total_page: loans.length / perPage + 1
                }
                var response = new CommonResponse("success", "", data)
                console.log("response", response)
                res.json(response)
            })
            .catch(err => {
                var response = new CommonResponse("error", "", err)
                console.log("response", response)
                res.json(response)
            })

    })
exports.convertInterest = (interest) =>
    new Promise((resovle, reject) => {
        var result = {
            id_lend: interest.lendingId,
            date: interest.date,
            money: interest.money,
            status: interest.status
        }
        resolve(result)

    })
// var createInterestLoan = (loanId) =>
//     new Promise((resolve, reject) => {
//         interest.find({ where: { loanId: loanId } })
//             .then(interests => {

//             })
//     })
exports.updateFullLoan = (loanId, total) =>
    new Promise((resolve, reject) => {
        var promisesInterest = [];
        var promises = [];
        var loanTemp, lendTemps;
        loan.findById(loanId)
            .then(loanResult => {
                loanTemp = loanResult;
                return lend.find({ where: { loanId: loanId } })
            })
            .then(lends => {
                lendTemps = lends;
                lends.forEach(lend => {
                    lend.status = 1;
                    promises.push(lend.save())
                })
                return Q.all(promises)
            })
            .then(() => {
                lendTemps.forEach(lendItem => {
                    let rate;
                    var money = loanTemp.amount;
                    if (money < 30) {
                        rate = 2;
                    } else if (money < 80) {
                        rate = 5
                    } else {
                        rate = 15
                    }
                    //tao cac interest

                    var range_time = loanTemp.range_time;
                    for (var j = 1; j <= range_time; j++) {
                        let day, interestTemp;
                        console.log('jUtil yy', j)
                        promisesInterest.push(
                            dayAfterSomeMonth(loanTemp.start_time, j)
                                .then(result => {
                                    day = result.result;
                                    return interest.create({
                                        order: j,
                                        date: day,
                                        money: parseFloat(((lendItem.amount * rate) / 100 + lendItem.amount / range_time).toFixed(2)),
                                        rate: rate,
                                        loanId: loanTemp.id,
                                        lendingId: lendItem.id,
                                        status: 0
                                    })

                                })
                                .then(interestResult => {
                                    interestTemp = interestResult;
                                    return interest_loan.findOne({ where: { loanId: interestResult.loanId, date: interestResult.date } })
                                })
                                .then(interestLoan => {
                                    if (interestLoan == null) {
                                        interest_loan.create({
                                            money: interestTemp.money,
                                            rate: interestTemp.rate,
                                            date: interestTemp.date,
                                            status: interestTemp.status,
                                            loanId: interestTemp.loanId
                                        })
                                    } else {
                                        interestLoan.money = parseFloat(((interestLoan.money * 1000000 + interestTemp.money * 1000000) / 1000000).toFixed(2))
                                        interestLoan.date = interestTemp.date;
                                        interestLoan.rate = parseFloat((100 * interestLoan.money / range_time).toFixed(0))
                                        interestLoan.save(err => {
                                            if (err)
                                                reject(err)
                                        })
                                    }
                                })
                                .catch(err => {
                                    reject(err)
                                })
                        )
                    }
                })

                return Q.all(promisesInterest);
            })
            .then(() => {
                return host.findById(loanTemp.hostId)
            })
            .then(host => {
                return exchangeMoneyWithoutToken(host.id, constant.ID_SYSTEM, loanTemp.amount)
            })
            .then(result => {
                if (result == "success") {
                    resolve("success");
                } else {
                    reject("exchange money error")
                }
            })
            .catch(err => {
                reject(err)
            })
    })
var getNextInterestLend = (lendId) =>
    new Promise((resolve, reject) => {
        var date = new Date();
        var now = date.getFullYear() + '' + date.getMonth() + date.getDate();
        var min, interestMin;
        interest.find({ where: { lendingId: lendId } })
            .then(interests => {
                interestMin = interests[0];
                min = interests[0].date;
                interests.forEach(interestItem => {
                    var date = interestItem.date;
                    var converTime = date.substr(6, 4) + date.substr(3, 2) + date.substr(0, 2);
                    if (convertTime > now && converTime < min) {
                        min = converTime;
                        interestMin = interestItem;
                    }
                })
                resolve(interestMin);
            })
            .catch(err => {
                reject(err)
            })
    })
exports.getNextInterestLend = getNextInterestLend;
var converTime = (date) =>
    new Promise((resolve, reject) => {

    })
exports.convertPackage = (listPackage) =>
    new Promise((resolve, reject) => {
        var result = [];
        listPackage.forEach(packages => {
            result.push({
                id: packages.id,
                money: packages.amount,
                chosen: packages.status
            })
        })
        resolve(result)
    })


var dayAfterSomeMonth = (day, range_time) =>
    new Promise((resolve, reject) => {
        var dayTemp = day.split('/');
        var year = parseInt(dayTemp[2]);
        var month = parseInt(dayTemp[1]);
        var date = parseInt(dayTemp[0]);
        var monthTemp = month + range_time;
        var monthResult, yearResult;
        if (monthTemp < 10) {
            monthResult = '0' + monthTemp
            yearResult = year + '';
        } else if (monthTemp <= 12) {
            monthResult = monthTemp + '';
            yearResult = year + '';
        } else if (monthTemp < 22) {
            monthResult = '0' + (monthTemp - 12).toString();
            yearResult = (year + 1).toString();
        } else {
            monthResult = monthTemp + '';
            yearResult = (year + 1) + ''
        }
        var result = date + '/' + monthResult + '/' + yearResult
        console.log('result', result)
        resolve({ result: result })
    })
var getInterestNearestOfLend = (lendId) =>
    new Promise((resolve, reject) => {
        var month, lendTemp;
        if (new Date().getMonth() + 2 < 10) {
            month = '0' + (new Date().getMonth() + 2)
        } else {
            month = '' + (new Date().getMonth() + 2)
        }
        var datenow = parseFloat('' + new Date().getFullYear() + month + new Date().getDate());
        // console.log('datenoew', datenow)
        lend.findById(lendId)
            .then(lendResult => {
                lendTemp = lendResult;
                return interest.find({ where: { lendingId: lendResult.id, status: 0 } })
            })
            .then(interests => {
                if (interests.length > 0) {
                    interests.forEach(interestItem => {
                        let dateInterest = parseFloat(interestItem.date.substr(6, 4) + interestItem.date.substr(3, 2) + interestItem.date.substr(0, 2));
                        if (dateInterest <= datenow) {
                            resolve(interestItem);
                        }
                    })
                    resolve(interests[0])
                } else {
                    var temp = {}
                    if (lendTemp.status = 1) {
                        lendTemp.status = 2;
                    }
                    lendTemp.save(err => {
                        if (err)
                            reject(err)
                    })
                    resolve(temp)
                }
            })
            .catch(err => {
                reject(err)
            })
    })
exports.getInterestNearestOfLend = getInterestNearestOfLend;


var getInterestNearestOfLoan = (loanId) =>
    new Promise((resolve, reject) => {
        var month, lendTemp, interestTemp;
        if (new Date().getMonth() + 2 < 10) {
            month = '0' + (new Date().getMonth() + 2)
        } else {
            month = '' + (new Date().getMonth() + 2)
        }
        var datenow = parseFloat('' + new Date().getFullYear() + month + new Date().getDate());
        // console.log('datenoew', datenow)
        interest_loan.find({ where: { loanId: loanId } })
            .then(interests => {
                interestTemp = interests;
                return interest_loan.find({ where: { loanId: loanId, status: 0 } })
            })
            .then(interests => {
                if (interests.length > 0) {
                    interests.forEach(interestItem => {
                        let dateInterest = parseFloat(interestItem.date.substr(6, 4) + interestItem.date.substr(3, 2) + interestItem.date.substr(0, 2));
                        if (dateInterest <= datenow) {
                            console.log('util 1')
                            resolve({ interestList: interestTemp, interestItem: interestItem });
                        }
                    })
                    console.log('util 2')
                    resolve({ interestList: interestTemp, interestItem: interests[0] });
                } else {
                    console.log('util 3')
                    var temp = {}
                    resolve(temp)
                }
            })
            .catch(err => {
                reject(err)
            })
    })
exports.getInterestNearestOfLoan = getInterestNearestOfLoan;

exports.getInterestMinOfLend = (lendingId) =>
    new Promise((resolve, reject) => {
        var interestMin;
        lend.findById(lendId)
            .then(lendResult => {
                return interest.find({ where: { lendingId: lendResult.id, status: 0 } })
            })
            .then(interests => {
                if (interests.length > 0) {
                    dateMinNumber = parseFloat(interests[0].date.substr(6, 4) + interests[0].date.substr(3, 2) + interests[0].date.substr(0, 2));
                    interests.forEach(interestItem => {
                        let dateInterest = parseFloat(interestItem.date.substr(6, 4) + interestItem.date.substr(3, 2) + interestItem.date.substr(0, 2));
                        if (dateInterest <= dateMinNumber) {
                            interestMin = interestItem
                        }
                    })
                } else {
                    var temp = {}
                    resolve(temp)
                }
                resolve(interestMin)
            })
            .catch(err => {
                reject(err)
            })
    })

exports.payInterest = (loanId) =>
    new Promise((resolve, reject) => {
        var hostTemp, interestTemp, promises = [];
        loan.findById(loanId)
            .then(loanResult => {
                return host.findOne({ where: { id: loanResult.hostId } })
            })
            .then(host => {
                hostTemp = host
                return lend.find({ where: { loanId: loanId } })
            })
            .then(lends => {
                lends.forEach(lendItem => {
                    promises.push(getInterestNearestOfLend(lendItem.id)
                        .then(interestResult => {
                            interestTemp = interestResult;
                            return chageMoney(hostTemp.id, lendItem.investorId, interestResult.money)
                        })
                        .then(result => {
                            interestTemp.status = 1;
                            interestTemp.save(err => {
                                if (err)
                                    reject(err)
                            })
                            return getInterestNearestOfLoan(loanId);
                        })
                        .then(interestLoan => {
                            console.log('utils iterest loan', interestLoan)
                            var interestLoanItem = interestLoan.interestItem;
                            interestLoanItem.status = 1;
                            interestLoanItem.save(err => {
                                if (err)
                                    reject(err)
                            })
                        })
                        .catch(err => {
                            reject(err)
                        })
                    )
                })
                return Q.all(promises)
            })
            .then(() => {
                console.log('fdfdfaddd')
                resolve('success')
            })
            .catch(err => {
                reject(err)
            })
    })
exports.getGoingLend = lendId =>
    new Promise((resolve, reject) => {
        var loanTemp, lendTemp, listInterest, total_money_received, total_money_will_receive, interestTemp, next_interest_money, next_interest_date;
        lend.findById(lendId)
            .then(lendResult => {
                lendTemp = lendResult;
                return interest.find({ where: { lendingId: lendId } })
            })
            .then(interests => {
                // console.log('2')
                // console.log('interestsOnGoing:', interests)
                listInterest = interests
                return loan.findOne({ where: { id: lendTemp.loanId } })
            })
            .then(loan => {
                // console.log('3')
                // console.log('loanOnGoing:', loan)
                loanTemp = loan;
                return getMoneyReceived(lendTemp.id)
            })
            .then(total => {
                // console.log('4')
                // console.log('totalonGoing:', total)
                total_money_received = total.total;
                return getMoneyWillReceive(lendTemp.id)
            })
            .then(total => {
                // console.log('5')
                // console.log('totalOngoing:', total)
                total_money_will_receive = total.total;
                return getInterestNearestOfLend(lendTemp.id);
            })
            .then(result => {
                // console.log('6')
                // console.log('resultOngoing:', result)
                interestTemp = result;
                next_interest_money = parseFloat(((result.money * 1000000 + next_interest_money * 1000000) / 1000000).toFixed(2));
                next_interest_date = result.date;
                return convertLoan(loanTemp.id)
            })
            .then(result => {
                // console.log('7')
                // console.log('resultOngoing2:', result)
                resolve({
                    loan: result,
                    total_lend_money: lendTemp.amount,
                    interest: interestTemp.rate,
                    start_time: lendTemp.start_time,
                    end_time: lendTemp.end_time,
                    total_money_will_receive: total_money_will_receive,
                    total_money_received: total_money_received,
                    next_interest_money: next_interest_money,
                    next_interest_date: next_interest_date,
                    list_interest: listInterest
                })
            })
            .catch(err => {
                reject(err)
            })
    })

var getTotalLendMoneyToHost = (loanId) =>
    new Promise((resolve, reject) => {
        var total = 0;
        loan.findById(loanId)
            .then(loan => {
                console.log(loan)
                resolve({ loan: loan.amount })
            })
            .catch(err => {
                reject(err)
            })
    });
var getTotalMoneyReceive = (loanId, investorId) =>
    new Promise((resolve, reject) => {
        var totalMoney = 0;
        lend.findOne({ 'where': { 'investorId': investorId, 'loanId': loanId } })
            .then(lend => {
                return interest.find({ 'where': { 'lendingId': lend.id, 'status': 1 } })
            })
            .then(moneyInterests => {
                moneyInterests.forEach(interest => {
                    totalMoney += interest.money;
                })
                resolve({ total: totalMoney })
            })
            .catch(err => {
                reject(err)
            })

    })
var getListInterestOfLoan = (loanId) =>
    new Promise((resolve, reject) => {

    })
var getTotalMoneyMustPaid = (loanId) =>
    new Promise((resolve, reject) => {
        var totalMoney = 0;
        lend.find({ where: { loanId: loanId } })
            .then(lends => {
                var promises = [];
                lends.forEach(lend => {
                    promises.push(getMoneyWillReceive(lend.id)
                        .then(result => {
                            totalMoney += result.total;
                        })
                    )
                })
                Q.all(() => {
                    resolve({ total: totalMoney })
                })

            })
            .catch(err => { reject(err) })
    })
var getMoneyWillReceive = (lendId) =>
    new Promise((resolve, reject) => {
        var totalMoney = 0;
        interest.find({ 'where': { 'lendingId': lendId } })
            .then(moneyInterests => {
                // console.log('moneyInterests', moneyInterests)
                moneyInterests.forEach(interest => {
                    totalMoney += interest.money;
                })
                console.log('totalMoney', totalMoney)
                resolve({ total: totalMoney })
            })
            .catch(err => {
                reject(err)
            })
    })
var getMoneyReceived = (lendId) =>
    new Promise((resolve, reject) => {
        var totalMoney = 0;
        interest.find({ 'where': { 'lendingId': lendId, 'status': 2 } })
            .then(moneyInterests => {
                moneyInterests.forEach(interest => {
                    totalMoney += interest.money;
                })
                resolve({ total: totalMoney })
            })
            .catch(err => {
                reject(err)
            })
    })
var dayAfterSomeMonth = (day, range_time) =>
    new Promise((resolve, reject) => {
        var dayTemp = day.split('/');
        var year = parseInt(dayTemp[2]);
        var month = parseInt(dayTemp[1]);
        var date = parseInt(dayTemp[0]);
        var monthTemp = month + range_time;
        var monthResult, yearResult;
        if (monthTemp < 10) {
            monthResult = '0' + monthTemp
            yearResult = year + '';
        } else if (monthTemp <= 12) {
            monthResult = monthTemp + '';
            yearResult = year + '';
        } else if (monthTemp < 22) {
            monthResult = '0' + (monthTemp - 12).toString();
            yearResult = (year + 1).toString();
        } else {
            monthResult = monthTemp + '';
            yearResult = (year + 1) + ''
        }
        var result = date + '/' + monthResult + '/' + yearResult
        console.log('result', result)
        resolve({ result: result })
    })