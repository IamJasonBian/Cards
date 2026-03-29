object ComputeGaps {

  def computeGaps(planets: List[(Int, Int)]): List[(Int, Int)] = {
    val intervals =
      planets
        .map { case (loc, orbit) => (loc - orbit, loc + orbit) }
        .sortBy(_._1)

    val merged =
      intervals.tail.foldLeft(List(intervals.head)) { (acc, interval) =>
        if (interval._1 <= acc.last._2)
          acc.init :+ (acc.last._1, acc.last._2 max interval._2)
        else
          acc :+ interval
      }

    val (gaps, cursor) =
      merged.foldLeft((List.empty[(Int, Int)], 0)) { case ((gaps, cursor), (start, end)) =>
        val newGaps = if (cursor < start) gaps :+ (cursor, start) else gaps
        (newGaps, end)
      }

    if (cursor < 1000) gaps :+ (cursor, 1000) else gaps
  }

  def main(args: Array[String]): Unit = {
    val testCases = List(
      (List((3,2)),                    List((0,1),(5,1000))),
      (List((3,2),(5,1)),              List((0,1),(6,1000))),
      (List((2,1),(5,1)),              List((0,1),(3,4),(6,1000))),
      (List((2,2),(7,1),(4,1)),        List((5,6),(8,1000))),
    )

    val passed = testCases.count { case (planets, expected) =>
      val result = computeGaps(planets)
      val ok = result == expected
      val status = if (ok) "PASS" else "FAIL"
      println(s"[$status] computeGaps($planets)")
      if (!ok) {
        println(s"       expected: $expected")
        println(s"       got:      $result")
      }
      ok
    }

    println(s"\n$passed/${testCases.length} passed")
  }
}
