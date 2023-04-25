import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, asc, desc, eq, gte, lte, or } from "drizzle-orm/expressions";

import { arofloTable } from "@/database/ArofloDataTable";

class ArofloRepository {
  constructor(private db: NodePgDatabase) {}

  public getUserActualDataForTimePeriod = async (
    userId: string,
    startDate: number,
    endDate: number
  ) => {
    const results = await this.db
      .select()
      .from(arofloTable)
      .where(
        and(
          gte(arofloTable.startDate, startDate),
          lte(arofloTable.endDate, endDate),
          eq(arofloTable.userId, userId)
        )
      )
      .orderBy(asc(arofloTable.startDate))
      .execute();

    return results;
  };

  public getUsers = async () => {
    return await this.db
      .select({ userId: arofloTable.userId })
      .from(arofloTable)
      .execute()
      .then((users) => {
        return [
          ...new Set(
            users.map((user) => {
              return user.userId;
            })
          ),
        ];
      });
  };
}

export default ArofloRepository;
