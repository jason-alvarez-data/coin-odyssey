import { createClient } from '@supabase/supabase-js';
import { pcgsService } from './pcgsService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class CoinValueUpdateService {
  private static readonly BATCH_SIZE = 50;
  private static readonly UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  static async updateCoinValues() {
    try {
      // Get all coins that haven't been updated in the last 24 hours
      const { data: coins, error } = await supabase
        .from('coins')
        .select('id, pcgs_id, grade')
        .or('last_value_update.is.null,last_value_update.lt.' + new Date(Date.now() - this.UPDATE_INTERVAL).toISOString())
        .limit(this.BATCH_SIZE);

      if (error) {
        console.error('Error fetching coins for update:', error);
        return;
      }

      if (!coins || coins.length === 0) {
        console.log('No coins need updating at this time');
        return;
      }

      // Process coins in batches
      const coinIds = coins.map(coin => coin.pcgs_id).filter(Boolean);
      if (coinIds.length === 0) return;

      const values = await pcgsService.bulkValueLookup(coinIds);

      // Update each coin's value in the database
      for (const coin of coins) {
        if (!coin.pcgs_id) continue;

        const value = values[coin.pcgs_id];
        if (!value) continue;

        // Update current value
        const { error: updateError } = await supabase
          .from('coins')
          .update({
            current_market_value: value.currentValue,
            last_value_update: new Date().toISOString()
          })
          .eq('id', coin.id);

        if (updateError) {
          console.error(`Error updating coin ${coin.id}:`, updateError);
          continue;
        }

        // Store historical value
        const { error: historyError } = await supabase
          .from('coin_value_history')
          .insert({
            coin_id: coin.id,
            value: value.currentValue,
            recorded_at: new Date().toISOString()
          });

        if (historyError) {
          console.error(`Error recording history for coin ${coin.id}:`, historyError);
        }
      }

      console.log(`Successfully updated ${coins.length} coins`);
    } catch (error) {
      console.error('Error in coin value update service:', error);
    }
  }

  // Start the update service
  static startUpdateService(interval = 60 * 60 * 1000) { // Default 1 hour interval
    setInterval(() => {
      this.updateCoinValues();
    }, interval);
  }
}

export default CoinValueUpdateService; 