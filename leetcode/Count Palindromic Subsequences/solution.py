def getResults(bids, totalShares):
    # Process the bids into a list of (bidder_id, shares_remaining)
    bidders = []
    for i in range(0, len(bids), 4):
        if i + 3 >= len(bids):
            break
        bidder_id = bids[i]
        shares = bids[i+1]
        bidders.append({
            'id': bidder_id,
            'shares': shares,
            'received': 0
        })
    
    result = set()
    allocated = 0
    
    # Keep allocating shares until we've allocated all requested shares or no more shares available
    while allocated < totalShares and any(bid['shares'] > 0 for bid in bidders):
        for bid in bidders:
            if bid['shares'] > 0 and allocated < totalShares:
                bid['shares'] -= 1
                bid['received'] += 1
                allocated += 1
                result.add(bid['id'])
    
    # Get all bidders who received at least one share, sorted by ID
    return sorted([bid['id'] for bid in bidders if bid['received'] > 0])

# Test case
if __name__ == "__main__":
    # Sample input: [1, 3, 1, 9866, 2, 1, 2, 5258, 3, 2, 4, 5788, 4, 2, 4, 6536], 2
    bids = [1, 3, 1, 9866, 2, 1, 2, 5258, 3, 2, 4, 5788, 4, 2, 4, 6536]
    totalShares = 2
    print(getResults(bids, totalShares))  # Expected output: [1, 2]