const utils = require("./utils.js");
const HATTokenLock = artifacts.require("./HATTokenLock.sol");
const { contract } = require("hardhat");
const {
  setup,
  advanceToSafetyPeriod,
  advanceToNonSafetyPeriod,
  submitClaim,
  assertFunctionRaisesException,
  ZERO_ADDRESS,
} = require("./common.js");
const { assert } = require("chai");

contract("Registry Arbitrator", (accounts) => {
  it("Set default arbitrator", async () => {
    const { registry, vault } = await setup(accounts, { setDefaultArbitrator: false });

    assert.equal(await registry.defaultArbitrator(), accounts[0]);
    assert.equal(await vault.getArbitrator(), accounts[0]);

    await assertFunctionRaisesException(
      registry.setDefaultArbitrator(accounts[1], { from: accounts[1] }),
      "Ownable: caller is not the owner"
    );

    tx = await registry.setDefaultArbitrator(accounts[1]);

    assert.equal(await registry.defaultArbitrator(), accounts[1]);
    assert.equal(await vault.getArbitrator(), accounts[1]);
    assert.equal(tx.logs[0].event, "SetDefaultArbitrator");
    assert.equal(tx.logs[0].args._defaultArbitrator, accounts[1]);
  });

  it("Set default challenge period", async () => {
    const { registry, vault } = await setup(
      accounts, { setDefaultArbitrator: false, challengePeriod: undefined}
    );


    assert.equal(await registry.defaultChallengePeriod(), 60 * 60 * 24 * 3);
    assert.equal(await vault.getChallengePeriod(), 60 * 60 * 24 * 3);

    await assertFunctionRaisesException(
      registry.setDefaultChallengePeriod(60 * 60 * 24, { from: accounts[1] }),
      "Ownable: caller is not the owner"
    );

    await assertFunctionRaisesException(
      registry.setDefaultChallengePeriod(60 * 60 * 24 - 1),
      "ChallengePeriodTooShort"
    );

    await assertFunctionRaisesException(
      registry.setDefaultChallengePeriod(60 * 60 * 24 * 5 + 1),
      "ChallengePeriodTooLong"
    );

    tx = await registry.setDefaultChallengePeriod(60 * 60 * 24);

    assert.equal(await registry.defaultChallengePeriod(), 60 * 60 * 24);
    assert.equal(await vault.getChallengePeriod(), 60 * 60 * 24);
    assert.equal(tx.logs[0].event, "SetDefaultChallengePeriod");
    assert.equal(tx.logs[0].args._defaultChallengePeriod, 60 * 60 * 24);

    tx = await registry.setDefaultChallengePeriod(60 * 60 * 24 * 5);

    assert.equal(await registry.defaultChallengePeriod(), 60 * 60 * 24 * 5);
    assert.equal(await vault.getChallengePeriod(), 60 * 60 * 24 * 5);
    assert.equal(tx.logs[0].event, "SetDefaultChallengePeriod");
    assert.equal(tx.logs[0].args._defaultChallengePeriod, 60 * 60 * 24 * 5);
  });

  it("Set default challengeTimeOutPeriod", async () => {
    const { registry, vault } = await setup(accounts);

    assert.equal(await registry.defaultChallengeTimeOutPeriod(), 60 * 60 * 24 * 35);
    assert.equal(await vault.getChallengeTimeOutPeriod(), 60 * 60 * 24 * 35);

    await assertFunctionRaisesException(
      registry.setDefaultChallengeTimeOutPeriod(60 * 60 * 24 * 2, { from: accounts[1] }),
      "Ownable: caller is not the owner"
    );

    await assertFunctionRaisesException(
      registry.setDefaultChallengeTimeOutPeriod(60 * 60 * 24 * 2 - 1),
      "ChallengeTimeOutPeriodTooShort"
    );

    await assertFunctionRaisesException(
      registry.setDefaultChallengeTimeOutPeriod(60 * 60 * 24 * 85 + 1),
      "ChallengeTimeOutPeriodTooLong"
    );

    tx = await registry.setDefaultChallengeTimeOutPeriod(60 * 60 * 24 * 2);

    assert.equal(await registry.defaultChallengeTimeOutPeriod(), 60 * 60 * 24 * 2);
    assert.equal(await vault.getChallengeTimeOutPeriod(), 60 * 60 * 24 * 2);
    assert.equal(tx.logs[0].event, "SetDefaultChallengeTimeOutPeriod");
    assert.equal(tx.logs[0].args._defaultChallengeTimeOutPeriod, 60 * 60 * 24 * 2);

    tx = await registry.setDefaultChallengeTimeOutPeriod(60 * 60 * 24 * 85);

    assert.equal(await registry.defaultChallengeTimeOutPeriod(), 60 * 60 * 24 * 85);
    assert.equal(await vault.getChallengeTimeOutPeriod(), 60 * 60 * 24 * 85);
    assert.equal(tx.logs[0].event, "SetDefaultChallengeTimeOutPeriod");
    assert.equal(tx.logs[0].args._defaultChallengeTimeOutPeriod, 60 * 60 * 24 * 85);
  });

  it("Set default arbitrator can change bounty", async () => {
    const { registry, vault } = await setup(accounts, { setDefaultArbitrator: false });

    assert.equal(await registry.defaultArbitratorCanChangeBounty(), true);
    assert.equal(await vault.getArbitratorCanChangeBounty(), true);

    await assertFunctionRaisesException(
      registry.setDefaultArbitratorCanChangeBounty(false, { from: accounts[1] }),
      "Ownable: caller is not the owner"
    );

    tx = await registry.setDefaultArbitratorCanChangeBounty(false);

    assert.equal(await registry.defaultArbitratorCanChangeBounty(), false);
    assert.equal(await vault.getArbitratorCanChangeBounty(), false);
    assert.equal(tx.logs[0].event, "SetDefaultArbitratorCanChangeBounty");
    assert.equal(tx.logs[0].args._defaultArbitratorCanChangeBounty, false);
  });

  it("Set default arbitrator can change beneficiary", async () => {
    const { registry, vault } = await setup(accounts, { setDefaultArbitrator: false });

    assert.equal(await registry.defaultArbitratorCanChangeBeneficiary(), false);
    assert.equal(await vault.getArbitratorCanChangeBeneficiary(), false);

    await assertFunctionRaisesException(
      registry.setDefaultArbitratorCanChangeBeneficiary(true, { from: accounts[1] }),
      "Ownable: caller is not the owner"
    );

    tx = await registry.setDefaultArbitratorCanChangeBeneficiary(true);

    assert.equal(await registry.defaultArbitratorCanChangeBeneficiary(), true);
    assert.equal(await vault.getArbitratorCanChangeBeneficiary(), true);
    assert.equal(tx.logs[0].event, "SetDefaultArbitratorCanChangeBeneficiary");
    assert.equal(tx.logs[0].args._defaultArbitratorCanChangeBeneficiary, true);
  });

  it("Set vault arbitration parameters", async () => {
    const { registry, vault } = await setup(
      accounts, { setDefaultArbitrator: false, challengePeriod: undefined}
    );

    assert.equal(await registry.defaultArbitrator(), accounts[0]);
    assert.equal(await vault.getArbitrator(), accounts[0]);

    assert.equal((await registry.defaultChallengePeriod()).toString(), 60 * 60 * 24 * 3);
    assert.equal(await vault.getChallengePeriod(), 60 * 60 * 24 * 3);

    assert.equal(await registry.defaultChallengeTimeOutPeriod(), 60 * 60 * 24 * 35);
    assert.equal(await vault.getChallengeTimeOutPeriod(), 60 * 60 * 24 * 35);

    assert.equal(await registry.defaultArbitratorCanChangeBounty(), true);
    assert.equal(await vault.getArbitratorCanChangeBounty(), true);

    await assertFunctionRaisesException(
      vault.setArbitrator(
        accounts[2],
        { from: accounts[1] }
      ),
      "OnlyRegistryOwner"
    );
    await assertFunctionRaisesException(
      vault.setChallengePeriod(
        60 * 60 * 24,
        { from: accounts[1] }
      ),
      "OnlyRegistryOwner"
    );
    await assertFunctionRaisesException(
      vault.setChallengeTimeOutPeriod(
        60 * 60 * 24 * 2,
        { from: accounts[1] }
      ),
      "OnlyRegistryOwner"
    );

    await assertFunctionRaisesException(
      vault.setChallengePeriod(60 * 60 * 24 - 1),
      "ChallengePeriodTooShort"
    );

    await assertFunctionRaisesException(
      vault.setArbitratorCanChangeBounty(
        0,
        { from: accounts[1] }
      ),
      "OnlyRegistryOwner"
    );

    await assertFunctionRaisesException(
      vault.setArbitratorCanChangeBeneficiary(
        0,
        { from: accounts[1] }
      ),
      "OnlyRegistryOwner"
    );

    await assertFunctionRaisesException(
      vault.setChallengePeriod(60 * 60 * 24 * 5 + 1),
      "ChallengePeriodTooLong"
    );

    await assertFunctionRaisesException(
      vault.setChallengeTimeOutPeriod(60 * 60 * 24 * 2 - 1),
      "ChallengeTimeOutPeriodTooShort"
    );

    await assertFunctionRaisesException(
      vault.setChallengeTimeOutPeriod(60 * 60 * 24 * 85 + 1),
      "ChallengeTimeOutPeriodTooLong"
    );

    let tx = await vault.setArbitrator(accounts[2]);
    assert.equal(tx.logs[0].event, "SetArbitrator");
    assert.equal(tx.logs[0].args._arbitrator, accounts[2]);

    tx = await vault.setChallengePeriod(60 * 60 * 24);
    assert.equal(tx.logs[0].event, "SetChallengePeriod");
    assert.equal(tx.logs[0].args._challengePeriod, 60 * 60 * 24);

    tx = await vault.setChallengeTimeOutPeriod(60 * 60 * 24 * 2);
    assert.equal(tx.logs[0].event, "SetChallengeTimeOutPeriod");
    assert.equal(tx.logs[0].args._challengeTimeOutPeriod, 60 * 60 * 24 * 2);

    tx = await vault.setArbitratorCanChangeBounty(1);
    assert.equal(tx.logs[0].event, "SetArbitratorCanChangeBounty");
    assert.equal(tx.logs[0].args._arbitratorCanChangeBounty, 1);

    tx = await vault.setArbitratorCanChangeBeneficiary(1);
    assert.equal(tx.logs[0].event, "SetArbitratorCanChangeBeneficiary");
    assert.equal(tx.logs[0].args._arbitratorCanChangeBeneficiary, 1);

    assert.equal(await registry.defaultArbitrator(), accounts[0]);
    assert.equal(await vault.getArbitrator(), accounts[2]);

    assert.equal(await registry.defaultChallengePeriod(), 60 * 60 * 24 * 3);
    assert.equal(await vault.getChallengePeriod(), 60 * 60 * 24);

    assert.equal(await registry.defaultChallengeTimeOutPeriod(), 60 * 60 * 24 * 35);
    assert.equal(await vault.getChallengeTimeOutPeriod(), 60 * 60 * 24 * 2);

    assert.equal(await registry.defaultArbitratorCanChangeBounty(), true);
    assert.equal(await vault.getArbitratorCanChangeBounty(), true);

    assert.equal(await registry.defaultArbitratorCanChangeBeneficiary(), false);
    assert.equal(await vault.getArbitratorCanChangeBeneficiary(), true);

    tx = await vault.setArbitrator(accounts[3]);
    assert.equal(tx.logs[0].event, "SetArbitrator");
    assert.equal(tx.logs[0].args._arbitrator, accounts[3]);

    tx = await vault.setChallengePeriod(60 * 60 * 24 * 5);
    assert.equal(tx.logs[0].event, "SetChallengePeriod");
    assert.equal(tx.logs[0].args._challengePeriod, 60 * 60 * 24 * 5);

    tx = await vault.setChallengeTimeOutPeriod(60 * 60 * 24 * 85);
    assert.equal(tx.logs[0].event, "SetChallengeTimeOutPeriod");
    assert.equal(tx.logs[0].args._challengeTimeOutPeriod, 60 * 60 * 24 * 85);

    tx = await vault.setArbitratorCanChangeBounty(0);
    assert.equal(tx.logs[0].event, "SetArbitratorCanChangeBounty");
    assert.equal(tx.logs[0].args._arbitratorCanChangeBounty, false);

    tx = await vault.setArbitratorCanChangeBeneficiary(0);
    assert.equal(tx.logs[0].event, "SetArbitratorCanChangeBeneficiary");
    assert.equal(tx.logs[0].args._arbitratorCanChangeBeneficiary, false);

    assert.equal(await registry.defaultArbitrator(), accounts[0]);
    assert.equal(await vault.getArbitrator(), accounts[3]);

    assert.equal(await registry.defaultChallengePeriod(), 60 * 60 * 24 * 3);
    assert.equal(await vault.getChallengePeriod(), 60 * 60 * 24 * 5);

    assert.equal(await registry.defaultChallengeTimeOutPeriod(), 60 * 60 * 24 * 35);
    assert.equal(await vault.getChallengeTimeOutPeriod(), 60 * 60 * 24 * 85);

    assert.equal(await registry.defaultArbitratorCanChangeBounty(), true);
    assert.equal(await vault.getArbitratorCanChangeBounty(), false);

    assert.equal(await registry.defaultArbitratorCanChangeBeneficiary(), false);
    assert.equal(await vault.getArbitratorCanChangeBeneficiary(), false);

    tx = await vault.setArbitrator(await vault.NULL_ADDRESS());
    assert.equal(tx.logs[0].event, "SetArbitrator");
    assert.equal(tx.logs[0].args._arbitrator, await vault.NULL_ADDRESS());

    tx = await vault.setChallengePeriod(await vault.NULL_UINT32());
    assert.equal(tx.logs[0].event, "SetChallengePeriod");
    assert.equal(tx.logs[0].args._challengePeriod.toString(), (await vault.NULL_UINT32()).toString());

    tx = await vault.setChallengeTimeOutPeriod(await vault.NULL_UINT32());
    assert.equal(tx.logs[0].event, "SetChallengeTimeOutPeriod");
    assert.equal(tx.logs[0].args._challengeTimeOutPeriod.toString(), (await vault.NULL_UINT32()).toString());

    tx = await vault.setArbitratorCanChangeBounty(2);
    assert.equal(tx.logs[0].event, "SetArbitratorCanChangeBounty");
    assert.equal(tx.logs[0].args._arbitratorCanChangeBounty, 2);

    tx = await vault.setArbitratorCanChangeBeneficiary(2);
    assert.equal(tx.logs[0].event, "SetArbitratorCanChangeBeneficiary");
    assert.equal(tx.logs[0].args._arbitratorCanChangeBeneficiary, 2);

    assert.equal(await registry.defaultArbitrator(), accounts[0]);
    assert.equal(await vault.getArbitrator(), accounts[0]);

    assert.equal(await registry.defaultChallengePeriod(), 60 * 60 * 24 * 3);
    assert.equal(await vault.getChallengePeriod(), 60 * 60 * 24 * 3);

    assert.equal(await registry.defaultChallengeTimeOutPeriod(), 60 * 60 * 24 * 35);
    assert.equal(await vault.getChallengeTimeOutPeriod(), 60 * 60 * 24 * 35);

    assert.equal(await registry.defaultArbitratorCanChangeBounty(), true);
    assert.equal(await vault.getArbitratorCanChangeBounty(), true);

    assert.equal(await registry.defaultArbitratorCanChangeBeneficiary(), false);
    assert.equal(await vault.getArbitratorCanChangeBeneficiary(), false);
  });

  it("No challenge, claim times out: anyone can approve claim", async () => {
    const { registry, vault, someAccount } = await setup(accounts);
    
    await advanceToNonSafetyPeriod(registry);
    // set challenge period to 1 day
    const challengePeriod = 60*60*24;
    await registry.setDefaultChallengePeriod(challengePeriod);

    await registry.setDefaultArbitrator(accounts[3]);

    await advanceToSafetyPeriod(registry);

    let claimId = await submitClaim(vault, { accounts });

    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 8000, ZERO_ADDRESS, { from: someAccount }),
      "UnchallengedClaimCanOnlyBeApprovedAfterChallengePeriod"
    );

    // go and pass the challenge period
    await utils.increaseTime(challengePeriod);
    // challenge period is over
    // anyone can now approve the claim, accepting the claim with the same amount is fine
    const tx = await vault.approveClaim(claimId, 1234, ZERO_ADDRESS, {
      from: someAccount,
    });

    assert.equal(tx.logs[6].event, "ApproveClaim");
    assert.equal(tx.logs[6].args._claimId, claimId);
    // the fact that approveclaim was called with a different percentage is ignored
    assert.equal(tx.logs[6].args._bountyPercentage.toString(), "8000");
  });

  it("Claim expires: anyone can dismiss", async () => {
    const { registry, vault } = await setup(accounts);

    await advanceToNonSafetyPeriod(registry);
    // set challenge period to 1 day
    const challengePeriod = 60*60*24;
    const challengeTimeOutPeriod = 60*60*24*5;
    const arbitrator = accounts[3];
    await registry.setDefaultChallengePeriod(challengePeriod);
    await registry.setDefaultChallengeTimeOutPeriod(challengeTimeOutPeriod);

    await registry.setDefaultArbitrator(arbitrator);

    await advanceToSafetyPeriod(registry);

    let claimId = await submitClaim(vault, { accounts });

    // go and pass the expiration time
    await utils.increaseTime(challengePeriod);
    await utils.increaseTime(challengeTimeOutPeriod);
    // the claim has expired
    // anyone can now dismiss the claim, it cannot be approved anymore
    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 6000, ZERO_ADDRESS, { from: arbitrator }),
      "ClaimExpired"
    );

    tx = await vault.dismissClaim(claimId);
    assert.equal(tx.logs[0].event, "DismissClaim");
    assert.equal(tx.logs[0].args._claimId, claimId);
  });

  it("Arbitrator can only change bounty if claim is challenged", async () => {
    const { registry, vault, stakingToken } = await setup(accounts);
    await advanceToNonSafetyPeriod(registry);
    // set challenge period to one day
    await registry.setDefaultChallengePeriod(60 * 60 * 24);

    const staker = accounts[1];
    await registry.setDefaultArbitrator(accounts[3]);

    // we send some funds to the vault so we can pay out later when approveClaim is called
    await stakingToken.mint(staker, web3.utils.toWei("2"));
    await stakingToken.approve(vault.address, web3.utils.toWei("1"), {
      from: staker,
    });
    await vault.deposit(web3.utils.toWei("1"), staker, { from: staker });

    await advanceToSafetyPeriod(registry);

    let claimId = await submitClaim(vault, { accounts });

    // go and pass the challenge period
    await utils.increaseTime(60 * 60 * 24);

    // challenge period is over
    // anyone can now approve the claim, accepting the claim with the same amount is fine
    const tx = await vault.approveClaim(claimId, 1234, ZERO_ADDRESS, {
      from: accounts[3],
    });
    assert.equal(tx.logs[8].event, "ApproveClaim");
    assert.equal(tx.logs[8].args._claimId, claimId);
    assert.equal(tx.logs[8].args._bountyPercentage.toString(), "8000");
    assert.equal(tx.logs[8].args._beneficiary, accounts[2]);
  });

  it("Arbitrator can only change beneficiary if claim is challenged", async () => {
    const { registry, vault, stakingToken } = await setup(accounts);
    await advanceToNonSafetyPeriod(registry);
    // set challenge period to one day
    await registry.setDefaultChallengePeriod(60 * 60 * 24);

    const staker = accounts[1];
    await registry.setDefaultArbitrator(accounts[3]);

    // we send some funds to the vault so we can pay out later when approveClaim is called
    await stakingToken.mint(staker, web3.utils.toWei("2"));
    await stakingToken.approve(vault.address, web3.utils.toWei("1"), {
      from: staker,
    });
    await vault.deposit(web3.utils.toWei("1"), staker, { from: staker });

    await advanceToSafetyPeriod(registry);

    let claimId = await submitClaim(vault, { accounts });

    // go and pass the challenge period
    await utils.increaseTime(60 * 60 * 24);

    // challenge period is over
    // anyone can now approve the claim, accepting the claim with the same amount is fine
    const tx = await vault.approveClaim(claimId, 0, accounts[3], {
      from: accounts[3],
    });
    assert.equal(tx.logs[8].event, "ApproveClaim");
    assert.equal(tx.logs[8].args._claimId, claimId);
    assert.equal(tx.logs[8].args._bountyPercentage.toString(), "8000");
    assert.equal(tx.logs[8].args._beneficiary, accounts[2]);
  });

  it("Arbitrator can only change bounty if can change bounty flag is true", async () => {
    const { registry, vault, stakingToken } = await setup(accounts);
    await advanceToNonSafetyPeriod(registry);
    // set challenge period to one day
    await registry.setDefaultChallengePeriod(60 * 60 * 24);

    const staker = accounts[1];
    await registry.setDefaultArbitrator(accounts[3]);

    // we send some funds to the vault so we can pay out later when approveClaim is called
    await stakingToken.mint(staker, web3.utils.toWei("2"));
    await stakingToken.approve(vault.address, web3.utils.toWei("1"), {
      from: staker,
    });
    await vault.deposit(web3.utils.toWei("1"), staker, { from: staker });

    await advanceToSafetyPeriod(registry);

    await vault.setArbitratorCanChangeBounty(0);

    let claimId = await submitClaim(vault, { accounts });

    await vault.challengeClaim(claimId, {from: accounts[3] });

    // this will only affect the next claim
    await vault.setArbitratorCanChangeBounty(1);

    let tx = await vault.approveClaim(claimId, 1234, ZERO_ADDRESS, {
      from: accounts[3],
    });
    assert.equal(tx.logs[8].event, "ApproveClaim");
    assert.equal(tx.logs[8].args._claimId, claimId);
    assert.equal(tx.logs[8].args._bountyPercentage.toString(), "8000");
    assert.equal(tx.logs[8].args._beneficiary, accounts[2]);

    claimId = await submitClaim(vault, { accounts });

    await vault.challengeClaim(claimId, {from: accounts[3] });

    tx = await vault.approveClaim(claimId, 1234, ZERO_ADDRESS, {
      from: accounts[3],
    });
    assert.equal(tx.logs[8].event, "ApproveClaim");
    assert.equal(tx.logs[8].args._claimId, claimId);
    assert.equal(tx.logs[8].args._bountyPercentage.toString(), "1234");
    assert.equal(tx.logs[8].args._beneficiary, accounts[2]);
  });

  it("Arbitrator can only change beneficiary if can change beneficiary flag is true", async () => {
    const { registry, vault, stakingToken } = await setup(accounts);
    await advanceToNonSafetyPeriod(registry);
    // set challenge period to one day
    await registry.setDefaultChallengePeriod(60 * 60 * 24);

    const staker = accounts[1];
    await registry.setDefaultArbitrator(accounts[3]);

    // we send some funds to the vault so we can pay out later when approveClaim is called
    await stakingToken.mint(staker, web3.utils.toWei("2"));
    await stakingToken.approve(vault.address, web3.utils.toWei("1"), {
      from: staker,
    });
    await vault.deposit(web3.utils.toWei("1"), staker, { from: staker });

    await advanceToSafetyPeriod(registry);

    await vault.setArbitratorCanChangeBeneficiary(0);

    let claimId = await submitClaim(vault, { accounts });

    await vault.challengeClaim(claimId, {from: accounts[3] });

    // this will only affect the next claim
    await vault.setArbitratorCanChangeBeneficiary(1);

    let tx = await vault.approveClaim(claimId, 0, accounts[3], {
      from: accounts[3],
    });
    assert.equal(tx.logs[8].event, "ApproveClaim");
    assert.equal(tx.logs[8].args._claimId, claimId);
    assert.equal(tx.logs[8].args._bountyPercentage.toString(), "8000");
    assert.equal(tx.logs[8].args._beneficiary.toString(), accounts[2]);

    claimId = await submitClaim(vault, { accounts });

    await vault.challengeClaim(claimId, {from: accounts[3] });

    tx = await vault.approveClaim(claimId, 0, accounts[3], {
      from: accounts[3],
    });
    assert.equal(tx.logs[8].event, "ApproveClaim");
    assert.equal(tx.logs[8].args._claimId, claimId);
    assert.equal(tx.logs[8].args._bountyPercentage.toString(), "8000");
    assert.equal(tx.logs[8].args._beneficiary, accounts[3]);
  });

  it("Arbitrator cannot challenge after challenge period", async () => {
    const { registry, vault, stakingToken } = await setup(accounts);
    await advanceToNonSafetyPeriod(registry);
    // set challenge period to one day
    await registry.setDefaultChallengePeriod(60 * 60 * 24);

    const staker = accounts[1];
    await registry.setDefaultArbitrator(accounts[3]);

    // we send some funds to the vault so we can pay out later when approveClaim is called
    await stakingToken.mint(staker, web3.utils.toWei("2"));
    await stakingToken.approve(vault.address, web3.utils.toWei("1"), {
      from: staker,
    });
    await vault.deposit(web3.utils.toWei("1"), staker, { from: staker });

    await advanceToSafetyPeriod(registry);

    let claimId = await submitClaim(vault, { accounts });

    // go and pass the challenge period
    await utils.increaseTime(60 * 60 * 24);

    // claim can only be challanged during the challenge period
    await assertFunctionRaisesException(
      vault.challengeClaim(claimId, { from: accounts[3] }),
      "ChallengePeriodEnded"
    );

    // challenge period is over
    // anyone can now approve the claim, accepting the claim with the same amount is fine
    const tx = await vault.approveClaim(claimId, 1234, ZERO_ADDRESS, {
      from: accounts[3],
    });
    assert.equal(tx.logs[8].event, "ApproveClaim");
    assert.equal(tx.logs[8].args._claimId, claimId);
    assert.equal(tx.logs[8].args._bountyPercentage.toString(), "8000");
  });

  it("challenge - approve Claim by arbitrator ", async () => {
    const { registry, vault, stakingToken, committee, arbitrator } = await setup(accounts);
    // set challenge period to one day
    await registry.setDefaultChallengePeriod(60 * 60 * 24);
    const owner = accounts[0];
    const staker = accounts[1];
    await advanceToSafetyPeriod(registry);

    // we send some funds to the vault so we can pay out later when approveClaim is called
    await stakingToken.mint(staker, web3.utils.toWei("2"));
    await stakingToken.approve(vault.address, web3.utils.toWei("1"), {
      from: staker,
    });
    await vault.deposit(web3.utils.toWei("1"), staker, { from: staker });

    let claimId = await submitClaim(vault, { accounts });

    // only arbitrator and governance can challenge the claim
    await assertFunctionRaisesException(
      vault.challengeClaim(claimId, { from: committee }),
      "OnlyArbitratorOrRegistryOwner"
    );

    let tx = await vault.challengeClaim(claimId, { from: arbitrator });
    assert.equal(tx.logs[0].event, "ChallengeClaim");
    assert.equal(tx.logs[0].args._claimId, claimId);

    // now that the claim is challenged, only arbitrator can accept or dismiss
    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 6000, ZERO_ADDRESS, { from: staker }),
      "ChallengedClaimCanOnlyBeApprovedByArbitratorUntilChallengeTimeoutPeriod"
    );
    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 6000, ZERO_ADDRESS, { from: owner }),
      "ChallengedClaimCanOnlyBeApprovedByArbitratorUntilChallengeTimeoutPeriod"
    );

    // the arbitrator must in any case respect the limits
    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 10001, ZERO_ADDRESS, { from: arbitrator }),
      "BountyPercentageHigherThanMaxBounty"
    );

    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 8001, ZERO_ADDRESS, { from: arbitrator }),
      "BountyPercentageHigherThanMaxBounty"
    );

    // go and pass the challenge period
    await utils.increaseTime(60 * 60 * 24);

    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 8000, ZERO_ADDRESS, { from: owner }),
      "ChallengedClaimCanOnlyBeApprovedByArbitratorUntilChallengeTimeoutPeriod"
    );
    assert.equal((await vault.activeClaim()).bountyPercentage, 8000);
    var stakingTokenBalanceBefore = await stakingToken.balanceOf(vault.address);
    tx = await vault.approveClaim(claimId, 6000, ZERO_ADDRESS, { from: arbitrator });
    assert.equal(tx.logs[8].event, "ApproveClaim");
    assert.equal(tx.logs[8].args._claimId, claimId);
    assert.equal(tx.logs[8].args._bountyPercentage, 6000);
    assert.equal(
      (await stakingToken.balanceOf(vault.address)).toString(),
      stakingTokenBalanceBefore.sub(new web3.utils.BN(web3.utils.toWei("0.6"))).toString()
    );
    var vestingTokenLock = await HATTokenLock.at(tx.logs[8].args._tokenLock);
    assert.equal(await vestingTokenLock.beneficiary(), accounts[2]);
    let depositValutBNAfterClaim = new web3.utils.BN(web3.utils.toWei("0.6"));
    let expectedHackerBalance = depositValutBNAfterClaim
      .mul(new web3.utils.BN(6000))
      .div(new web3.utils.BN(10000));
    assert.isTrue(
      (await stakingToken.balanceOf(vestingTokenLock.address)).eq(
        expectedHackerBalance
      )
    );
    assert.isTrue(
      new web3.utils.BN(tx.logs[8].args._claimBounty.hackerVested).eq(
        expectedHackerBalance
      )
    );
    assert.isTrue(
      expectedHackerBalance.eq(await vestingTokenLock.managedAmount())
    );
  });

  it("challenge - governance can challenge claim", async () => {
    const { registry, vault, stakingToken, arbitrator } = await setup(accounts);
    // set challenge period to one day
    await registry.setDefaultChallengePeriod(60 * 60 * 24);
    const owner = accounts[0];
    const staker = accounts[1];
    await advanceToSafetyPeriod(registry);

    // we send some funds to the vault so we can pay out later when approveClaim is called
    await stakingToken.mint(staker, web3.utils.toWei("2"));
    await stakingToken.approve(vault.address, web3.utils.toWei("1"), {
      from: staker,
    });
    await vault.deposit(web3.utils.toWei("1"), staker, { from: staker });

    let claimId = await submitClaim(vault, { accounts });

    let tx = await vault.challengeClaim(claimId, { from: owner });
    assert.equal(tx.logs[0].event, "ChallengeClaim");
    assert.equal(tx.logs[0].args._claimId, claimId);

    await vault.dismissClaim(claimId, { from: arbitrator });
  });

  it("challenge - arbitrator changes after claim submitted", async () => {
    const { registry, vault, stakingToken, arbitrator } = await setup(accounts);
    // set challenge period to one day
    await registry.setDefaultChallengePeriod(60 * 60 * 24);
    const staker = accounts[1];
    const newArbitrator = accounts[3];
    await advanceToSafetyPeriod(registry);

    // we send some funds to the vault so we can pay out later when approveClaim is called
    await stakingToken.mint(staker, web3.utils.toWei("2"));
    await stakingToken.approve(vault.address, web3.utils.toWei("1"), {
      from: staker,
    });
    await vault.deposit(web3.utils.toWei("1"), staker, { from: staker });

    let claimId = await submitClaim(vault, { accounts });

    await vault.setArbitrator(newArbitrator);
    // only arbitrator at the time of submission and governance can challenge the claim
    await assertFunctionRaisesException(
      vault.challengeClaim(claimId, { from: newArbitrator }),
      "OnlyArbitratorOrRegistryOwner"
    );

    let tx = await vault.challengeClaim(claimId, { from: arbitrator });
    assert.equal(tx.logs[0].event, "ChallengeClaim");
    assert.equal(tx.logs[0].args._claimId, claimId);
    
    await assertFunctionRaisesException(
      vault.dismissClaim(claimId, { from: newArbitrator }),
      "OnlyCallableByArbitratorOrAfterChallengeTimeOutPeriod"
    );

    await vault.dismissClaim(claimId, { from: arbitrator });

    claimId = await submitClaim(vault, { accounts });
    await assertFunctionRaisesException(
      vault.challengeClaim(claimId, { from: arbitrator }),
      "OnlyArbitratorOrRegistryOwner"
    );
    tx = await vault.challengeClaim(claimId, { from: newArbitrator });
    assert.equal(tx.logs[0].event, "ChallengeClaim");
    assert.equal(tx.logs[0].args._claimId, claimId);

    await assertFunctionRaisesException(
      vault.dismissClaim(claimId, { from: arbitrator }),
      "OnlyCallableByArbitratorOrAfterChallengeTimeOutPeriod"
    );

    await vault.dismissClaim(claimId, { from: newArbitrator });
  });

  it("anyone can dismiss Claim after challengeTimeOutPeriod", async () => {
    const { registry, vault, arbitrator } = await setup(accounts);
    await advanceToSafetyPeriod(registry);
  
    // set challenge timeout period to two days
    const challengeTimeOutPeriod = 60 * 60 * 24 * 2;
    await registry.setDefaultChallengeTimeOutPeriod(challengeTimeOutPeriod);

    let claimId = await submitClaim(vault, { accounts });

    await vault.challengeClaim(claimId, { from: arbitrator });
    const someAccount = accounts[5];

    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 8000, ZERO_ADDRESS, { from: someAccount }),
      "ChallengedClaimCanOnlyBeApprovedByArbitratorUntilChallengeTimeoutPeriod"
    );
    await assertFunctionRaisesException(
      vault.dismissClaim(claimId, { from: someAccount }),
      "OnlyCallableByArbitratorOrAfterChallengeTimeOutPeriod"
    );
     // go and pass the challenge period
    await utils.increaseTime(challengeTimeOutPeriod + 1);
    
    // challengeTimeOut has passed, not even the arbitrator can approve now
    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 8000, ZERO_ADDRESS, { from: someAccount }),
      "ChallengedClaimCanOnlyBeApprovedByArbitratorUntilChallengeTimeoutPeriod"
    );
    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 8000, ZERO_ADDRESS, { from: arbitrator }),
      "ChallengedClaimCanOnlyBeApprovedByArbitratorUntilChallengeTimeoutPeriod"
    );

    // but anyone  can dismiss the claim
    await vault.dismissClaim(claimId, { from: someAccount });
  });

  it("challenge - dismiss claim by arbitrator", async () => {
    const { registry, vault, arbitrator } = await setup(accounts);
    // set challenge period to one day
    const someAccount = accounts[4];
    await registry.setDefaultChallengePeriod(60 * 60 * 24);
    await registry.setDefaultArbitrator(arbitrator);
    await advanceToSafetyPeriod(registry);
    let claimId = await submitClaim(vault, { accounts });

    await vault.challengeClaim(claimId, { from: arbitrator });
    // now that the claim is challenged, only arbitrator can accept or dismiss
    await assertFunctionRaisesException(
      vault.dismissClaim(claimId, { from: someAccount }),
      "OnlyCallableByArbitratorOrAfterChallengeTimeOutPeriod"
    );

    await assertFunctionRaisesException(
      vault.dismissClaim(claimId, { from: someAccount }),
      "OnlyCallableByArbitratorOrAfterChallengeTimeOutPeriod"
    );
    tx = await vault.dismissClaim(claimId, { from: arbitrator });
    assert.equal(tx.logs[0].event, "DismissClaim");
    assert.equal(tx.logs[0].args._claimId, claimId);
  });

  it("challenge - dismiss claim by anyone after timeout", async () => {
    const { registry, vault, arbitrator, owner } = await setup(accounts);
    const someAccount = accounts[5];
    // set challenge period to one day
    const challengePeriod = 60*60*24*1;
    const challengeTimeOutPeriod = 60*60*24*2;
    await registry.setDefaultChallengePeriod(challengePeriod);
    await registry.setDefaultChallengeTimeOutPeriod(challengeTimeOutPeriod);

    await advanceToSafetyPeriod(registry);
    let claimId = await submitClaim(vault, { accounts });

    await vault.challengeClaim(claimId, { from: arbitrator });

    await utils.increaseTime(challengeTimeOutPeriod);

    // challenge has timed out: anyone can dismiss but nobody can approve
    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 8000, ZERO_ADDRESS, { from: owner }),
      "ChallengedClaimCanOnlyBeApprovedByArbitratorUntilChallengeTimeoutPeriod"
    );

    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 8000, ZERO_ADDRESS, { from: arbitrator }),
      "ChallengedClaimCanOnlyBeApprovedByArbitratorUntilChallengeTimeoutPeriod"
    );

    await vault.dismissClaim(claimId, { from: someAccount });
  });

  it("claim can only be submitted during safety period", async () => {
    const {registry, vault } = await setup(accounts);
    const committee = accounts[1];
    const arbitrator = accounts[2];
    await registry.setDefaultArbitrator(arbitrator);

   
    await advanceToNonSafetyPeriod(registry);
    // challengeClaim will fail if no active claim exists
    await assertFunctionRaisesException(
      vault.submitClaim(committee, 8, "", { from: committee, }),
      "NotSafetyPeriod"
    );
 

  });


  it("only active claim can be challenged", async () => {
    const {registry, vault } = await setup(accounts);
    const committee = accounts[1];
    const arbitrator = accounts[2];
    await registry.setDefaultArbitrator(arbitrator);
    await advanceToSafetyPeriod(registry);

    // challengeClaim will fail if no active claim exists
    await assertFunctionRaisesException(
      vault.challengeClaim(web3.utils.randomHex(32), { from: accounts[2] }),
      "NoActiveClaimExists"
    );
    


    let tx = await vault.submitClaim(committee, 8, "", { from: committee, });
    const claimId1 = tx.logs[0].args._claimId;
    await assertFunctionRaisesException(
      vault.challengeClaim(web3.utils.randomHex(32), { from: accounts[2] }),
      "ClaimIdIsNotActive"
    );

    await vault.challengeClaim(claimId1, { from: arbitrator });
    await vault.dismissClaim(claimId1, { from: arbitrator });

    await assertFunctionRaisesException(
        vault.challengeClaim(claimId1, { from: arbitrator }),
        "NoActiveClaimExists"
    );
  });


  it("claim can be challenged only once", async () => {
    const {registry, vault } = await setup(accounts);
    const committee = accounts[1];
    const arbitrator = accounts[2];
    await registry.setDefaultArbitrator(arbitrator);
    await advanceToSafetyPeriod(registry);
    let tx = await vault.submitClaim(committee, 8, "", { from: committee, });
    const claimId1 = tx.logs[0].args._claimId;
    await vault.challengeClaim(claimId1, { from: arbitrator });
    // challenging claim 1 a second time will revert 
    await assertFunctionRaisesException(
        vault.challengeClaim(claimId1, { from: arbitrator }),
        "ClaimAlreadyChallenged"
    );
  });

  it("will get a fresh claim id for each claim", async () => {
    const {registry, vault } = await setup(accounts);
    const committee = accounts[1];
    const arbitrator = accounts[2];
    await registry.setDefaultArbitrator(arbitrator);
    await advanceToSafetyPeriod(registry);
    // submit, challenge and dimiss claim 1
    let tx = await vault.submitClaim(committee, 8, "", { from: committee, });
    const claimId1 = tx.logs[0].args._claimId;
    await vault.challengeClaim(claimId1, { from: arbitrator });
    await vault.dismissClaim(claimId1, { from: arbitrator });
    let tx2 = await vault.submitClaim(committee, 8, "", { from: committee, });
    const claimId2 = tx2.logs[0].args._claimId;
    assert.notEqual(claimId1, claimId2, "second claim id is the same as the first");
  });

  it("only active claim can be approved", async () => {
    const {committee, registry, vault, arbitrator } = await setup(accounts);
   await advanceToSafetyPeriod(registry);

    // challengeClaim will fail if no active claim exists
    await assertFunctionRaisesException(
      vault.approveClaim(web3.utils.randomHex(32), 8, ZERO_ADDRESS, { from: accounts[2] }),
      "NoActiveClaimExists"
    );

    let tx = await vault.submitClaim(committee, 8, "", { from: committee, });
    const claimId = tx.logs[0].args._claimId;
    await assertFunctionRaisesException(
      vault.approveClaim(web3.utils.randomHex(32), 8, ZERO_ADDRESS, { from: accounts[2] }),
      "ClaimIdIsNotActive"
    );

    await vault.challengeClaim(claimId, { from: arbitrator });
    await vault.dismissClaim(claimId, { from: arbitrator });

    await assertFunctionRaisesException(
        vault.approveClaim(claimId, 8, ZERO_ADDRESS, { from: arbitrator }),
        "NoActiveClaimExists"
    );
  });

  it("only challenged claim can be approved", async () => {
    const { registry, vault } = await setup(accounts);
    await advanceToSafetyPeriod(registry);

    const claimId = await submitClaim(vault, {accounts});
    await assertFunctionRaisesException(
      vault.approveClaim(claimId, 8, ZERO_ADDRESS, { from: accounts[2] }),
      "UnchallengedClaimCanOnlyBeApprovedAfterChallengePeriod"
    );
  });

 
  it("only active claim can be dismissed", async () => {
    const {registry, vault, arbitrator, committee } = await setup(accounts);
    await advanceToSafetyPeriod(registry);

    // challengeClaim will fail if no active claim exists
    await assertFunctionRaisesException(
      vault.dismissClaim(web3.utils.randomHex(32), { from: accounts[2] }),
      "NoActiveClaimExists"
    );

    let tx = await vault.submitClaim(committee, 8, "", { from: committee, });
    const claimId1 = tx.logs[0].args._claimId;
    await assertFunctionRaisesException(
      vault.challengeClaim(web3.utils.randomHex(32), { from: accounts[2] }),
      "ClaimIdIsNotActive"
    );

    await vault.challengeClaim(claimId1, { from: arbitrator });
    await vault.approveClaim(claimId1, 1, ZERO_ADDRESS, { from: arbitrator });

    await assertFunctionRaisesException(
        vault.dismissClaim(claimId1, { from: arbitrator }),
        "NoActiveClaimExists"
    );
  });

   it("only challenged claim can be dismissed", async () => {
    const { registry, vault, arbitrator } = await setup(accounts);
    await advanceToSafetyPeriod(registry);

    const claimId = await submitClaim(vault, {accounts});
    await assertFunctionRaisesException(
      vault.dismissClaim(claimId, { from: arbitrator }),
      "OnlyCallableIfChallenged"
    );
  });
});
