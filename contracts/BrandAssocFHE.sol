// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract BrandAssocFHE is SepoliaConfig {
    struct EncryptedSurvey {
        uint256 id;
        euint32 encryptedResponses;
        euint32 encryptedBrandId;
        euint32 encryptedPlatformId;
        uint256 timestamp;
    }

    struct DecryptedSurvey {
        string responses;
        string brandId;
        string platformId;
        bool isRevealed;
    }

    uint256 public surveyCount;
    mapping(uint256 => EncryptedSurvey) public encryptedSurveys;
    mapping(uint256 => DecryptedSurvey) public decryptedSurveys;

    mapping(string => euint32) private encryptedBrandCount;
    string[] private brandList;

    mapping(uint256 => uint256) private requestToSurveyId;

    event SurveySubmitted(uint256 indexed id, uint256 timestamp);
    event DecryptionRequested(uint256 indexed id);
    event SurveyDecrypted(uint256 indexed id);

    modifier onlyContributor(uint256 surveyId) {
        _;
    }

    function submitEncryptedSurvey(
        euint32 encryptedResponses,
        euint32 encryptedBrandId,
        euint32 encryptedPlatformId
    ) public {
        surveyCount += 1;
        uint256 newId = surveyCount;

        encryptedSurveys[newId] = EncryptedSurvey({
            id: newId,
            encryptedResponses: encryptedResponses,
            encryptedBrandId: encryptedBrandId,
            encryptedPlatformId: encryptedPlatformId,
            timestamp: block.timestamp
        });

        decryptedSurveys[newId] = DecryptedSurvey({
            responses: "",
            brandId: "",
            platformId: "",
            isRevealed: false
        });

        emit SurveySubmitted(newId, block.timestamp);
    }

    function requestSurveyDecryption(uint256 surveyId) public onlyContributor(surveyId) {
        EncryptedSurvey storage survey = encryptedSurveys[surveyId];
        require(!decryptedSurveys[surveyId].isRevealed, "Already decrypted");

        bytes32[] memory ciphertexts = new bytes32[](3);
        ciphertexts[0] = FHE.toBytes32(survey.encryptedResponses);
        ciphertexts[1] = FHE.toBytes32(survey.encryptedBrandId);
        ciphertexts[2] = FHE.toBytes32(survey.encryptedPlatformId);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptSurvey.selector);
        requestToSurveyId[reqId] = surveyId;

        emit DecryptionRequested(surveyId);
    }

    function decryptSurvey(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 surveyId = requestToSurveyId[requestId];
        require(surveyId != 0, "Invalid request");

        EncryptedSurvey storage eSurvey = encryptedSurveys[surveyId];
        DecryptedSurvey storage dSurvey = decryptedSurveys[surveyId];
        require(!dSurvey.isRevealed, "Already decrypted");

        FHE.checkSignatures(requestId, cleartexts, proof);

        string[] memory results = abi.decode(cleartexts, (string[]));

        dSurvey.responses = results[0];
        dSurvey.brandId = results[1];
        dSurvey.platformId = results[2];
        dSurvey.isRevealed = true;

        if (!FHE.isInitialized(encryptedBrandCount[dSurvey.brandId])) {
            encryptedBrandCount[dSurvey.brandId] = FHE.asEuint32(0);
            brandList.push(dSurvey.brandId);
        }
        encryptedBrandCount[dSurvey.brandId] = FHE.add(
            encryptedBrandCount[dSurvey.brandId],
            FHE.asEuint32(1)
        );

        emit SurveyDecrypted(surveyId);
    }

    function getDecryptedSurvey(uint256 surveyId) public view returns (
        string memory responses,
        string memory brandId,
        string memory platformId,
        bool isRevealed
    ) {
        DecryptedSurvey storage s = decryptedSurveys[surveyId];
        return (s.responses, s.brandId, s.platformId, s.isRevealed);
    }

    function getEncryptedBrandCount(string memory brandId) public view returns (euint32) {
        return encryptedBrandCount[brandId];
    }

    function requestBrandCountDecryption(string memory brandId) public {
        euint32 count = encryptedBrandCount[brandId];
        require(FHE.isInitialized(count), "Brand not found");

        bytes32[] memory ciphertexts = new bytes32[](1);
        ciphertexts[0] = FHE.toBytes32(count);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptBrandCount.selector);
        requestToSurveyId[reqId] = bytes32ToUint(keccak256(abi.encodePacked(brandId)));
    }

    function decryptBrandCount(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 brandHash = requestToSurveyId[requestId];
        string memory brandId = getBrandFromHash(brandHash);

        FHE.checkSignatures(requestId, cleartexts, proof);

        uint32 count = abi.decode(cleartexts, (uint32));
    }

    function bytes32ToUint(bytes32 b) private pure returns (uint256) {
        return uint256(b);
    }

    function getBrandFromHash(uint256 hash) private view returns (string memory) {
        for (uint i = 0; i < brandList.length; i++) {
            if (bytes32ToUint(keccak256(abi.encodePacked(brandList[i]))) == hash) {
                return brandList[i];
            }
        }
        revert("Brand not found");
    }
}