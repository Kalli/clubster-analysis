In the chart below we see the $clubCount clubs that are part of this data set. 
The size of each bubble reflects the amount of RA users following that club, 
while the colour of the bubble reflects the *community* that it belongs to. 

The communities are calculated based on how similar the line ups for each pair of 
clubs are. If two clubs have many artists and djs in common then those two clubs 
are likely to be be in the same community<sup>1</sup>.

You can click on each club to see more details about it, which artists featured 
on their line up most often and which other clubs are similar to it. Keep
scrolling to learn more.

<details>
<summary>Show footnotes</summary>

1\. To calculate communities we first calculate the overlap in lineups between each pair of clubs. Based on how many bookings the two venues have in common we calculate what is called the [Jaccard index](https://en.wikipedia.org/wiki/Jaccard_index). 

From these calculations we create a [network](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics) where the clubs are the nodes and their Jaccard index values are the edges connecting the nodes. We then run [community detection](https://en.wikipedia.org/wiki/Louvain_modularity) algorithms on the network to detect communities or clusters of clubs that are strongly connected themselves. This groups 

</details>


--- 

Lets take a look at the clubs of a specific region. Let's begin with 
[Berlin](https://www.residentadvisor.net/events/de/berlin) one of the worlds 
clubbing capitals.

It is noticeable that except for *Berghain / Panorama Bar* all these clubs belong 
to the same community. A similar pattern holds for quite a 
few regions and countries, perhaps because many clubs rely on local or domestic 
talent for many of their bookings while the superclubs book a wider variety 
of international talent?

--- 
But how similar are the most popular clubs on Resident Advisor?

Let's compare two of my favourite clubs. Berlin's *Berghain / Panorama Bar* and
*De School* in Amsterdam. Their line have a 9.58% overlap. I went into 
this project thinking that the line ups were more similar than they turned out to be. 
For these two clubs for instance I assumed that the overlap would be greater as 
their music policies feel quite similar to me. 
 
Whether you find 10% high or low depends on your perspective of course. Should 
each city and club have their own distinct scenes and flavours? Or is it to be  
expected that big global names dominate clubs across countries and continents?

Out of $combinations possible pairs of clubs, $linkCount pairs had some overlap, 
out of those the average overlap was $averageWeight%. *$source* and *$target* have 
the most similar line ups, with $weight% overlap in their bookings.

---

Now we've changed the view to look at something I call *the residency factor*. 
For this we take the number of unique artists booked and divide it by the total 
number of bookings, that is to say how often on average a club books a given artist<sup>2</sup>.

For clubs that rely on residents, the same artists playing at a club regularly and repeatedly, 
this number would be higher whereas if you only book each artist once this number would be 1.

The average residency factor is $averageResidency and only a handful of clubs go above 2.

<details>
<summary>Show footnotes</summary>

2\. A few caveats here. For this view we've filtered out clubs that had less than 10 dates or booked fewer than 20 artists in total in 2019. 

Furthermore all the data here is limited to djs and artists that have a profile on Resident Advisor. For some genres and scenes, like house and techno, this the coverage is near complete, but for <a href="https://www.residentadvisor.net/events/1281396">others</a> this data is sometimes incomplete.

</details>

--- 

That is not to say that there aren't regularly and repeatedly booked residents at these clubs. 
In fact the most booked artists in this data set are ones that are doing week after 
week at the same club. [Hitch](https://www.residentadvisor.net/dj/hitch) (76 bookings at <em>Input</em>),
[Raymundo Rodriguez](https://www.residentadvisor.net/dj/raymundorodriguez) (51 bookings at <em>Corsica Studios</em>) 
and [Dexon](https://www.residentadvisor.net/dj/dexon)  (46 bookings at <em>Melkweg</em>) 
are the three most booked artists across the 131 clubs in this data set.
 
But there are also a great number of one-off bookings, bringing the averages down. 
This lends support to the theory that the most popular clubs today build their 
appeal not by honing and supporting local residents but rather by building on a wider, 
globetrotting talent pool. 