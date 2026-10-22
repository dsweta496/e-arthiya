const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EArthiyaTradeRegistry", function () {
  async function deploy() {
    const [owner, operator, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EArthiyaTradeRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();
    return { registry, owner, operator, outsider };
  }

  it("records a trade event once", async function () {
    const { registry } = await deploy();
    const id = ethers.id("commitment:demo-1");
    const entity = ethers.id("commitment-demo-1");
    const type = ethers.id("COMMITMENT_CONFIRMED");
    const payload = ethers.id("non-sensitive-demo-payload");
    await expect(registry.recordTradeEvent(id, entity, type, payload))
      .to.emit(registry, "TradeEventRecorded").withArgs(
        id, entity, type, payload, (await ethers.getSigners())[0].address, anyValue, 
      );
    expect(await registry.recordedEventIds(id)).to.equal(true);
    await expect(registry.recordTradeEvent(id, entity, type, payload))
      .to.be.revertedWithCustomError(registry, "EventAlreadyRecorded");
  });

  it("restricts writes to operators", async function () {
    const { registry, outsider } = await deploy();
    await expect(
      registry.connect(outsider).recordTradeEvent(
        ethers.id("e"), ethers.id("x"), ethers.id("T"), ethers.id("p")
      )
    ).to.be.revertedWithCustomError(registry, "NotOperator");
  });

  it("lets the owner authorize another operator", async function () {
    const { registry, operator } = await deploy();
    await registry.setOperator(operator.address, true);
    expect(await registry.operators(operator.address)).to.equal(true);
  });
});

// Hardhat chai matchers exposes anyValue through its matcher package.
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
