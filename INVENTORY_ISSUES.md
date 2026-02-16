# Inventory System - Incomplete Use Cases Analysis

## 🔍 Overview
This document identifies all incomplete or improperly implemented inventory item use cases in the Kasiko Discord bot.

---

## ❌ Critical Issues

### 1. **Drink** - Incomplete Activation System
**Location**: `src/inventory.js` (lines 423-448)

**Issues**:
- ✅ Marked as `activatable: true`
- ✅ Has `usableIn: ["crime"]`
- ❌ **Empty `useHandler` function** (line 440-441)
- ❌ **Not checked/used in `crime.js`**
- ❌ **Functionality not implemented**: Description says "Can increase your crime rewards by 100%" but this is never applied

**Expected Behavior**:
- Should activate before/during crime command
- Should double crime rewards when active
- Should consume 1 drink item when activated
- Should have a duration/cooldown system

**Current State**:
```javascript
async useHandler (args, context) {}, // EMPTY!
```

**Files Affected**:
- `src/inventory.js` - Empty handler
- `src/txtcommands/economy/crime.js` - No drink check/usage

**Recommendation**:
1. Implement `useHandler` to activate drink buff
2. Store active buffs in user data (e.g., `activeBoosts.drink`)
3. Modify `crime.js` to check for active drink buff and double rewards
4. Add expiration system for buffs

---

### 2. **Torch** - Missing Use Handler
**Location**: `src/inventory.js` (lines 472-489)

**Issues**:
- ✅ Marked as `useable: true`
- ✅ Has `usableIn: ['dungeon', "hunt"]`
- ❌ **No `useHandler` defined**
- ❌ **Not checked/used in `dungeon.js`**
- ❌ **Not checked/used in `huntCommand.js`**
- ❌ **Functionality not implemented**: Description says "May reduce the chances of falling into traps" but this is never applied

**Expected Behavior**:
- Should be usable before dungeon/hunt commands
- Should reduce trap/failure chances
- Should consume 1 torch item when used
- Should provide temporary buff for next dungeon/hunt

**Current State**:
```javascript
// No useHandler property defined at all!
```

**Files Affected**:
- `src/inventory.js` - Missing handler
- `src/txtcommands/games/dungeon.js` - No torch check
- `src/txtcommands/wildlife/huntCommand.js` - No torch check

**Recommendation**:
1. Add `useHandler` to torch item definition
2. Implement buff system that reduces trap chances
3. Modify dungeon.js and huntCommand.js to check for active torch buff
4. Consume torch on use

---

### 3. **Ticket** - Inconsistent Usage
**Location**: `src/inventory.js` (lines 514-530)

**Issues**:
- ✅ Marked as `useable: true`
- ✅ Has `usableIn: ["loot"]`
- ❌ **No `useHandler` defined**
- ⚠️ **Consumed directly in `loot.js`** (line 114-118) instead of through use command
- ❌ **Cannot be used via `use ticket` command**

**Expected Behavior**:
- Should be usable via `use ticket` command
- Should activate loot mission selection
- Should consume ticket when used

**Current State**:
- Tickets are consumed directly in `loot.js` without going through the use command system
- `use ticket` command will fail because no handler exists

**Files Affected**:
- `src/inventory.js` - Missing handler
- `src/txtcommands/economy/loot.js` - Direct consumption (bypasses use system)

**Recommendation**:
1. Add `useHandler` that triggers loot mission selection
2. Refactor `loot.js` to accept pre-activated state
3. OR keep current system but mark ticket as `useable: false` and document it's consumed automatically

---

## 🏷️ Selling Issues

### 4. **Lollipop** - Cannot Be Sold
**Location**: `src/inventory.js` (lines 449-471), `src/txtcommands/shop/sell.js`

**Issues**:
- ✅ Marked as `sellable: true`
- ✅ Has `sellPrice: 5000`
- ❌ **Not handled in `sell.js`**
- ❌ **Cannot be sold despite being marked as sellable**

**Expected Behavior**:
- Should be sellable via `sell lollipop [amount]`
- Should give 5000 cash per lollipop

**Current State**:
- `sell.js` only handles: cars, structures, jewelry, animals, flowers
- No inventory item selling logic exists

**Files Affected**:
- `src/inventory.js` - Item marked as sellable
- `src/txtcommands/shop/sell.js` - No inventory item handling

**Recommendation**:
1. Add inventory item selling logic to `sell.js`
2. Check `ITEM_DEFINITIONS` for sellable items
3. Implement selling with proper validation

---

### 5. **Teddy Bear** - Cannot Be Sold
**Location**: `src/inventory.js` (lines 490-513), `src/txtcommands/shop/sell.js`

**Issues**:
- ✅ Marked as `sellable: true`
- ✅ Has `sellPrice: 6500`
- ❌ **Not handled in `sell.js`**
- ❌ **Cannot be sold despite being marked as sellable**

**Expected Behavior**:
- Should be sellable via `sell teddy [amount]`
- Should give 6500 cash per teddy bear

**Recommendation**: Same as Lollipop (#4)

---

### 6. **Milk** - Cannot Be Sold / Recipe System Missing
**Location**: `src/inventory.js` (lines 531-552), `src/txtcommands/shop/sell.js`

**Issues**:
- ✅ Marked as `sellable: true`
- ✅ Has `sellPrice: 10000`
- ❌ **Not handled in `sell.js`**
- ❌ **Cannot be sold despite being marked as sellable**
- ⚠️ **Description says "Used in recipes"** but no recipe system found

**Expected Behavior**:
- Should be sellable via `sell milk [amount]`
- Should give 10000 cash per milk
- Should be usable in recipe system (if implemented)

**Recommendation**:
1. Add selling support (same as #4, #5)
2. Implement recipe system OR remove "Used in recipes" from description

---

## 📊 Summary Table

| Item | Issue Type | Severity | Status |
|------|-----------|----------|--------|
| **drink** | Missing functionality | 🔴 Critical | Empty handler, not used in crime |
| **torch** | Missing handler | 🔴 Critical | No handler, not used in dungeon/hunt |
| **ticket** | Inconsistent usage | 🟡 Medium | Consumed directly, not via use command |
| **lollipop** | Cannot sell | 🟡 Medium | Marked sellable but no sell logic |
| **teddy** | Cannot sell | 🟡 Medium | Marked sellable but no sell logic |
| **milk** | Cannot sell + Missing feature | 🟡 Medium | Marked sellable + recipe system missing |

---

## 🔧 Implementation Recommendations

### Priority 1: Fix Critical Issues

#### 1. Implement Drink Activation System
```javascript
// In src/inventory.js - drink item
async useHandler(args, context) {
  return generalUse(args, context, this, async (userData, args, context) => {
    const { id, name } = discordUser(context);
    
    // Check if already active
    if (userData.activeBoosts?.drink?.expiresAt > Date.now()) {
      return handleMessage(context, {
        content: `⚠️ You already have an active drink boost!`
      });
    }
    
    // Activate drink boost (30 minutes)
    const expiresAt = Date.now() + (30 * 60 * 1000);
    userData.inventory['drink'] -= 1;
    
    await updateUser(id, {
      [`inventory.drink`]: userData.inventory['drink'],
      'activeBoosts.drink': {
        active: true,
        expiresAt: expiresAt,
        multiplier: 2.0 // 100% increase = 2x
      }
    });
    
    return handleMessage(context, {
      content: `🍺 **${name}**, drink activated! Your next crime rewards will be doubled for 30 minutes!`
    });
  });
}
```

Then modify `crime.js`:
```javascript
// Check for active drink boost
const drinkBoost = userData.activeBoosts?.drink;
const isDrinkActive = drinkBoost?.active && drinkBoost.expiresAt > Date.now();

if (isDrinkActive && earnedCash > 0) {
  earnedCash = Math.floor(earnedCash * drinkBoost.multiplier);
  // Deactivate after use
  await updateUser(id, {
    'activeBoosts.drink.active': false
  });
}
```

#### 2. Implement Torch Use Handler
```javascript
// In src/inventory.js - torch item
async useHandler(args, context) {
  return generalUse(args, context, this, async (userData, args, context) => {
    const { id, name } = discordUser(context);
    
    // Activate torch buff (next dungeon/hunt only)
    userData.inventory['torch'] -= 1;
    
    await updateUser(id, {
      [`inventory.torch`]: userData.inventory['torch'],
      'activeBoosts.torch': {
        active: true,
        trapReduction: 0.3 // 30% reduction in trap chances
      }
    });
    
    return handleMessage(context, {
      content: `🔦 **${name}**, torch activated! Your next dungeon or hunt will have reduced trap chances!`
    });
  });
}
```

Then modify `dungeon.js` and `huntCommand.js` to check for active torch buff.

### Priority 2: Fix Selling System

#### Add Inventory Item Selling to sell.js
```javascript
// In src/txtcommands/shop/sell.js
// After checking categories, add inventory item check:

// Check if it's an inventory item
const itemDef = findItemByIdOrAlias(itemId);
if (itemDef && itemDef.sellable && itemDef.sellPrice) {
  // Handle inventory item selling
  const userData = await getUserData(userId);
  const itemCount = userData.inventory?.[itemDef.id] || 0;
  
  if (itemCount < 1) {
    return handleMessage(context, {
      content: `❌ You don't have any ${itemDef.emoji} **${itemDef.name}** to sell.`
    });
  }
  
  const sellAmount = amountArg === "all" ? itemCount : parseInt(amountArg) || 1;
  const totalPrice = sellAmount * itemDef.sellPrice;
  
  // Update user
  await updateUser(userId, {
    cash: userData.cash + totalPrice,
    [`inventory.${itemDef.id}`]: Math.max(itemCount - sellAmount, 0)
  });
  
  return handleMessage(context, {
    content: `✅ Sold **${sellAmount}** ${itemDef.emoji} **${itemDef.name}** for <:kasiko_coin:1300141236841086977> **${totalPrice.toLocaleString()}**`
  });
}
```

### Priority 3: Fix Ticket Usage

**Option A**: Add useHandler to ticket
```javascript
async useHandler(args, context) {
  // Trigger loot command with pre-activated state
  // This requires refactoring loot.js
}
```

**Option B**: Mark ticket as not useable
```javascript
useable: false, // Since it's consumed automatically in loot command
```

---

## 📝 Testing Checklist

After implementing fixes, test:

- [ ] `use drink` activates boost
- [ ] Crime command doubles rewards when drink is active
- [ ] Drink boost expires after duration
- [ ] `use torch` activates buff
- [ ] Dungeon/hunt commands check for torch buff
- [ ] Torch reduces trap chances
- [ ] `sell lollipop` works
- [ ] `sell teddy` works  
- [ ] `sell milk` works
- [ ] Selling validates amounts correctly
- [ ] Selling updates cash correctly
- [ ] Selling removes items from inventory correctly

---

## 🎯 Additional Notes

1. **Active Boosts System**: The user schema already has `activeBoosts: {}` field, which is perfect for storing temporary buffs.

2. **Consistency**: Consider standardizing how items are consumed:
   - Some items consumed via `use` command
   - Some items consumed directly in commands (ticket)
   - Some items never consumed (rose when shared)

3. **Documentation**: Update item descriptions to accurately reflect their functionality.

4. **Error Handling**: Add proper error messages when:
   - User tries to use item they don't have
   - User tries to sell item they don't have
   - Buff is already active

---

*Report generated: 2026-02-17*
*Total incomplete items: 6*
*Critical issues: 2*
*Medium issues: 4*
