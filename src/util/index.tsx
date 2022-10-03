import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { useSelector } from 'react-redux';
import React, { useState, useEffect } from 'react';


export const errHandler = (err: any) => {
    if (err) {
        console.log(err)
        if (err.code === 4001) {
            tips("you have cancelled the subscription")
        } else if (err.code === 'NETWORK_ERROR') {
            tips("Please check your network connection!")
        } else {
            tips(err.message)
        }
    } else {
        console.log("ignorant error")
        tips("ignorant error")
    }
}
export const toHex = (val: string | number): string => new window.Web3().utils.toHex(val)

export const tips = (html: string) => {
    toast(html, {
        position: "top-right",
        autoClose: 4000,
    });
}

/**
 * change data type from Number to BigNum 
 * @param {Number} value - data that need to be change
 * @param {Number} d - decimals
 */
export const toBigNum = (value: any, d: any) => {
    return ethers.utils.parseUnits(Number(value).toFixed(d), d);
}

/**
 * change data type from BigNum to Number
 * @param {Number} value - data that need to be change
 * @param {Number} d - decimals
 */
export const fromBigNum = (value: any, d: any) => {
    return parseFloat(ethers.utils.formatUnits(value, d));
}

export const NF = (num: number, p: number = 2) => Number(num).toFixed(p).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const TF = (time: number, offset: number = 2) => {
    let iOffset = Number(offset);
    let date = time === undefined ? new Date(Date.now() * 1000 + (3600000 * iOffset)) : (typeof time === 'number' ? new Date(time * 1000 + (3600000 * iOffset)) : new Date(+time + (3600000 * iOffset)));
    let y = date.getUTCFullYear();
    let m = date.getUTCMonth() + 1;
    let d = date.getUTCDate();
    let hh = date.getUTCHours();
    let mm = date.getUTCMinutes();
    let ss = date.getUTCSeconds();
    let dt = ("0" + m).slice(-2) + "-" + ("0" + d).slice(-2);
    let tt = ("0" + hh).slice(-2) + ":" + ("0" + mm).slice(-2) + ":" + ("0" + ss).slice(-2);
    return y + '-' + dt + ' ' + tt;
}
export const simpleAddress = (address: string, first?: number, second?: number) => {
    let one; let two; let newAddress;
    if (address && first && second) {
        one = address.slice(0, first);
        two = address.slice(address?.length - second, address.length);
    } else {
        one = address.slice(0, 4);
        two = address.slice(address?.length - 4, address.length);
    }
    newAddress = one + '...' + two;
    return newAddress;
}
export const copyToClipboard = (text: string) => {
    var textField = document.createElement('textarea')
    textField.innerText = text
    document.body.appendChild(textField)
    textField.select()
    document.execCommand('copy')
    textField.remove()
    tips(text);
};

export const USD = (amount: number, price: any) => {
    if (amount !== 0)
        return (<span className='text-green-600'>${(amount * price).toFixed(2)}</span>);
    else
        return ''
}