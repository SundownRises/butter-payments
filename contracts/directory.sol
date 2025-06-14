// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


contract Directory {

mapping(string => address) public addressesByName;
mapping(address=>string) public reverseLookup;

address public  zeroaddress  = 0x0000000000000000000000000000000000000000;
   
    constructor() {
        addressesByName["theboss"]= msg.sender;
        reverseLookup[msg.sender]="theboss";
    }

    function setAddressByName(string memory name) public{
        require(addressesByName[name]==zeroaddress, "name already exists");
        require(getLength(name) > 0,"Can't set zero length name");
        addressesByName[name] = msg.sender;
        reverseLookup[msg.sender]=name;
        
    }

    function getLength(string memory s) public pure returns (uint256) 
   {
        bytes memory b = bytes(s);
        return b.length;
    }
} 
