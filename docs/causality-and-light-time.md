# Causality and light-travel time

Let `D` be distance, `c` the speed of light, and `t_receive` the date a photon reaches Earth.

```text
t_emit = t_receive - D/c
```

If a physical model predicts a remaining lifetime `Delta_t` from the emitted state represented by those photons:

```text
t_collapse = t_emit + Delta_t
t_arrival  = t_collapse + D/c
           = t_receive - D/c + Delta_t + D/c
           = t_receive + Delta_t
```

The distance cancels from the predicted Earth waiting time because the prediction is conditioned on the state observed now. It still controls the coordinate epoch of emission and collapse.

For `t_receive = 2026`, `D = 172 pc` (about 561 light-years), and `Delta_t = 300 years`:

```text
emission state:      about 1465 CE
coordinate collapse: about 1765 CE
signal arrival:      2326 CE
Earth waiting time:  300 years
```

The first two dates depend on distance and a chosen coordinate frame. The arrival date does not depend on distance under this conditioning. The Python implementation samples the asymmetric 172 +13/-11 pc posterior using a seeded two-piece normal approximation and tests the cancellation for very different distances.

This does not prove whether an event has already happened in a selected Galactic frame. It states why that remote fact is not observable before its light or neutrinos arrive.
