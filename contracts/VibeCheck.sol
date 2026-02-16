// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VibeCheck — On-chain Token Safety Attestations
/// @notice Stores AI-generated safety scores for BSC tokens on opBNB
/// @dev Deployed on opBNB for cheap attestation storage (~$0.003/tx)
contract VibeCheck {
    struct Attestation {
        address token;         // Token contract address (on BSC)
        uint8 score;           // Safety score 0-100
        string riskLevel;      // "SAFE", "CAUTION", "DANGER", "CRITICAL"
        string reportCID;      // IPFS CID or content hash of full report
        uint256 timestamp;
        address scanner;       // Who initiated the scan
    }

    // token address => array of attestations
    mapping(address => Attestation[]) public tokenAttestations;
    
    // Global scan counter
    uint256 public totalScans;
    
    // Recent scans (circular buffer of last 50)
    address[] public recentTokens;
    
    // Events
    event TokenScanned(
        address indexed token,
        uint8 score,
        string riskLevel,
        string reportCID,
        address indexed scanner,
        uint256 timestamp
    );

    /// @notice Submit a safety attestation for a token
    /// @param token The BSC token contract address
    /// @param score Safety score 0-100 (100 = safest)
    /// @param riskLevel Human-readable risk category
    /// @param reportCID IPFS CID or hash of the full analysis report
    function submitAttestation(
        address token,
        uint8 score,
        string calldata riskLevel,
        string calldata reportCID
    ) external {
        require(score <= 100, "Score must be 0-100");
        
        tokenAttestations[token].push(Attestation({
            token: token,
            score: score,
            riskLevel: riskLevel,
            reportCID: reportCID,
            timestamp: block.timestamp,
            scanner: msg.sender
        }));
        
        totalScans++;
        recentTokens.push(token);
        
        emit TokenScanned(token, score, riskLevel, reportCID, msg.sender, block.timestamp);
    }

    /// @notice Get all attestations for a token
    function getAttestations(address token) external view returns (Attestation[] memory) {
        return tokenAttestations[token];
    }

    /// @notice Get the latest safety score for a token
    function getLatestScore(address token) external view returns (uint8 score, string memory riskLevel, uint256 timestamp) {
        Attestation[] storage a = tokenAttestations[token];
        require(a.length > 0, "No attestations");
        Attestation storage latest = a[a.length - 1];
        return (latest.score, latest.riskLevel, latest.timestamp);
    }

    /// @notice Get number of attestations for a token
    function getAttestationCount(address token) external view returns (uint256) {
        return tokenAttestations[token].length;
    }

    /// @notice Get recent scanned tokens (last N)
    function getRecentTokens(uint256 count) external view returns (address[] memory) {
        uint256 len = recentTokens.length;
        if (count > len) count = len;
        address[] memory recent = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = recentTokens[len - count + i];
        }
        return recent;
    }
}
