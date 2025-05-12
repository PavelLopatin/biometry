const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying rubERC20...");
    const rubERC20 = await ethers.getContractFactory("ERC20Token");
    const contractrubERC20 = await rubERC20.deploy('sRUB', 'sRUB', 100000000, 2);
    await contractrubERC20.waitForDeployment();
    console.log("rub deployed to:", await contractrubERC20.getAddress());

    console.log("Deploying SimpleAccountFactory...");
    const SimpleAccountFactory = await ethers.getContractFactory("SimpleAccountFactory");
    const contractSimpleAccountFactory = await SimpleAccountFactory.deploy();
    await contractSimpleAccountFactory.waitForDeployment();
    console.log("SimpleAccountFactory deployed to:", await contractSimpleAccountFactory.getAddress());
}

main();