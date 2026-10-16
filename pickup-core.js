'use strict';

(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TerraPickups = api;
})(typeof globalThis === 'object' ? globalThis : this, function() {
  function selectCollector(cars, point, radius = 42) {
    let winner = null;
    let bestDistance = radius * radius;
    for (const car of cars) {
      if (car.finishTime != null || (car.z || 0) > 22) continue;
      const dx = car.x - point.x, dy = car.y - point.y;
      const distance = dx * dx + dy * dy;
      if (distance > bestDistance) continue;
      if (distance < bestDistance || winner === null || car.number < winner.number) {
        winner = car;
        bestDistance = distance;
      }
    }
    return winner;
  }

  function claim(pickup, car) {
    if (!pickup.active || !car) return false;
    pickup.active = false;
    pickup.collectedBy = car.number;
    pickup.respawnLap = car.lap + 1;
    return true;
  }

  function respawnOnLap(pickup, car) {
    if (pickup.active || pickup.collectedBy !== car.number || pickup.respawnLap > car.lap) return false;
    pickup.active = true;
    pickup.collectedBy = null;
    return true;
  }

  return { selectCollector, claim, respawnOnLap };
});
