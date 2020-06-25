In the chart to the right we see the $clubCount clubs that we looked at. 
The size of each bubble reflects the amount of RA users following that club, 
while the colour of the bubble reflects the community that it belongs to. 

The communities are calculated based on how similar the line ups for each pair of 
clubs are. If two clubs have many artists and djs in common then those two clubs 
are likely to be be in the same community<sup>1</sup>.

You can click on each club to see more details about it, which artists featured 
on their line up most often and which other clubs are similar to it. Keep
scrolling to learn more.

<div class="footnote">

1\. To calculate communities we first calculate the overlap in lineups between each pair of clubs. Based on how many bookings the two venues have in common we calculate what is called the [Jaccard index](https://en.wikipedia.org/wiki/Jaccard_index). 

From these calculations we create a [network](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics) where the clubs are the nodes and the Jaccard index are the edges connecting the nodes. We then run [community detection](https://en.wikipedia.org/wiki/Louvain_modularity) algorithms on the network to detect communities or clusters of clubs that are strongly connected themselves. This groups 


</div>

--- 

Lets take a look at the clubs of a specific region. Let's begin with 
[Berlin](https://www.residentadvisor.net/events/de/berlin) one of the worlds 
clubbing capitals.

It is noticeable that except for Berghain / Panorama Bar all these clubs belong 
to the same community. A similar pattern holds for quite a few regions and countries, 
perhaps because many clubs rely on local or domestic talent for many of their 
bookings while the superclubs can book a wider variety of international talent?

---

If we change our view to the country level and go to the United Kingdom we can 
see that most London clubs fall into one community while other parts of Britain and 
Glasgow cluster in a different way. Perhaps there is a specific London sound that 
dominates the capital? 

---

Let's compare two of my favourite clubs. Berlin's *Berghain / Panorama Bar* and
Amsterdam's *De School*. I went into this project thinking that the line ups 
 were more similar than they turned out to be. For instance for these two clubs
  I assumed that overlap would be greater as their music policies feel quite 
  similar to me. 
 
Whether you find 10% high or low depends on your perspective of course. On
average the clubs in this data set had around $averageWeight% overlap. There were 
$linkCount pairs of out of $total pairs of clubs that had any commonalities in 
their line ups. *$source* and *$target* have the most similar line ups, with 
$weight% overlap in their bookings.