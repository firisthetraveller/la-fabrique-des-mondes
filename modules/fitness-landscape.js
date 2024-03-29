import * as THREE from "three";
import { Hitbox } from "../utils";

function getRandomColor() {
  const colors = [0x5112b8, 0xff6fff, 0x6e34ea, 0xf6c94f];
  return colors[Math.floor(Math.random() * 4)];
}

class FitnessLandscape {
  constructor(control = undefined) {
    this.settings = {
      colors: [],
      gridSize: 10,
      vertices: new Float32Array(20 * 20 * 3),
      materialFacesColor: getRandomColor(),
      targetValue: 0.5,
      landscapeNb: 1,
      factor: 25,
    };
    this.anchor = new THREE.Object3D();

    this.control = control;
  }

  /**
   * Main genetic algorithm with adaptive landscape display.
   *
   * @param {number} popSize - Population size.
   * @param {number} generations - Number of generations.
   * @param {number} mutationRate - Rate of mutation in the population.
   */
  geneticAlgorithmWithAdaptiveLandscape(popSize, generations, mutationRate) {
    let population = this.generatePopulation(popSize);
    const adaptiveLandscapeInterval = Math.floor(
      generations / this.settings.landscapeNb
    );

    for (let gen = 0; gen < generations; gen++) {
      this.evaluatePopulation(population);
      const parents = this.selectParents(population);
      const newPopulation = [];

      while (newPopulation.length < popSize) {
        const [parent1, parent2] = this.crossover(parents);
        this.mutate(parent1, mutationRate);
        this.mutate(parent2, mutationRate);
        newPopulation.push(parent1, parent2);
      }

      population = newPopulation;

      if (gen % adaptiveLandscapeInterval === 0) {
        this.evaluatePopulation(population);
        this.displayFitnessMap(population);
      }
    }

    this.evaluatePopulation(population);
  }

  displayFitnessMap(population) {
    const gridSize = this.settings.gridSize;
    const vertices = this.createPoints(population, this.settings.vertices);

    const linesGeometry = new THREE.BufferGeometry();
    const linesVertices = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const currentIndex = i * gridSize + j;
        const [currentX, currentY, currentZ] = vertices.slice(
          currentIndex * 3,
          currentIndex * 3 + 3
        );

        if (j < gridSize - 1) {
          const rightIndex = i * gridSize + (j + 1);
          const [rightX, rightY, rightZ] = vertices.slice(
            rightIndex * 3,
            rightIndex * 3 + 3
          );

          linesVertices.push(
            currentX,
            currentY,
            currentZ,
            rightX,
            rightY,
            rightZ
          );
        }

        if (i < gridSize - 1) {
          const bottomIndex = (i + 1) * gridSize + j;
          const [bottomX, bottomY, bottomZ] = vertices.slice(
            bottomIndex * 3,
            bottomIndex * 3 + 3
          );

          linesVertices.push(
            currentX,
            currentY,
            currentZ,
            bottomX,
            bottomY,
            bottomZ
          );
        }
      }

      const facesVertices = this.createFaces(vertices);
      const facesGeometry = new THREE.BufferGeometry();

      facesGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(facesVertices, 3)
      );

      // Calculate normals for the geometry
      facesGeometry.computeVertexNormals();

      const materialFaces = new THREE.MeshPhongMaterial({
        color: this.settings.materialFacesColor,
      });

      materialFaces.side = THREE.DoubleSide;
      const fitnessFaces = new THREE.Mesh(facesGeometry, materialFaces);
      fitnessFaces.receiveShadow = true;
      this.anchor.add(fitnessFaces);
    }

    linesGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linesVertices, 3)
    );
    linesGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(this.settings.colors, 3)
    );

    const materialLines = new THREE.LineBasicMaterial({ vertexColors: true });
    materialLines.side = THREE.DoubleSide;
    const fitnessLines = new THREE.LineSegments(linesGeometry, materialLines);
    this.anchor.add(fitnessLines);

    // Create hitbox & link to mesh
    this.hitbox = new Hitbox();
    this.hitbox.handler(this.control, this.hitbox.mesh, this.anchor);
    this.anchor.add(this.hitbox.mesh);
  }

  createPoints(population, vertices) {
    const gridSize = this.settings.gridSize;
    const gridStep = 1;

    for (let i = 0, x = -gridSize / 2; i < gridSize; i++, x += gridStep) {
      for (let j = 0, z = -gridSize / 2; j < gridSize; j++, z += gridStep) {
        const index = i * gridSize + j;
        if (index < population.length) {
          const fitness = population[index].fitness;
          let y;
          if (i == 0 || i == gridSize - 1 || j == 0 || j == gridSize - 1) y = 0;
          else y = fitness * this.settings.factor;
          vertices[index * 3] = x;
          vertices[index * 3 + 1] += y;
          vertices[index * 3 + 2] = z;
        }
      }
    }

    return vertices;
  }

  createFaces(vertices) {
    const facesVertices = [];
    const gridSize = this.settings.gridSize;

    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const currentIndex = i * gridSize + j;
        const nextIndex = currentIndex + 1;
        const belowIndex = (i + 1) * gridSize + j;
        const belowNextIndex = belowIndex + 1;

        const [currentX, currentY, currentZ] = vertices.slice(
          currentIndex * 3,
          currentIndex * 3 + 3
        );
        const [nextX, nextY, nextZ] = vertices.slice(
          nextIndex * 3,
          nextIndex * 3 + 3
        );
        const [belowX, belowY, belowZ] = vertices.slice(
          belowIndex * 3,
          belowIndex * 3 + 3
        );
        const [belowNextX, belowNextY, belowNextZ] = vertices.slice(
          belowNextIndex * 3,
          belowNextIndex * 3 + 3
        );

        facesVertices.push(
          currentX,
          currentY,
          currentZ,
          nextX,
          nextY,
          nextZ,
          belowX,
          belowY,
          belowZ
        );
        facesVertices.push(
          belowX,
          belowY,
          belowZ,
          nextX,
          nextY,
          nextZ,
          belowNextX,
          belowNextY,
          belowNextZ
        );

        const minY = 0;
        const maxY = 50;
        const factor = (currentY - minY) / (maxY - minY);

        const interpolatedColor = interpolateColor(
          "#660FE3",
          "#F6C94F",
          factor
        );

        this.settings.colors.push(interpolatedColor);

        this.settings.colors.push(
          currentX / 30 + 0.5,
          currentY / 30 + 0.5,
          currentZ / 30 + 0.5
        );
      }
    }

    return facesVertices;
  }

  generatePopulation(popSize) {
    const population = [];
    for (let i = 0; i < popSize; i++) {
      const individual = {
        chromosome: Math.random() * 10,
        fitness: 0,
      };
      population.push(individual);
    }
    return population;
  }

  evaluatePopulation(population) {
    for (const individual of population) {
      individual.fitness = this.fitnessFunction(individual.chromosome);
    }
  }

  selectParents(population) {
    const totalFitness = population.reduce(
      (sum, individual) => sum + individual.fitness,
      0
    );
    const parents = [];
    for (let i = 0; i < population.length; i++) {
      const pick = Math.random() * totalFitness;
      let currentSum = 0;
      for (const individual of population) {
        currentSum += individual.fitness;
        if (currentSum >= pick) {
          parents.push(individual);
          break;
        }
      }
    }
    return parents;
  }

  crossover(parents) {
    const crossoverPoint = Math.random();
    const child1 = {
      chromosome:
        parents[0].chromosome * crossoverPoint +
        parents[1].chromosome * (1 - crossoverPoint),
      fitness: this.fitnessFunction(),
    };
    const child2 = {
      chromosome:
        parents[1].chromosome * crossoverPoint +
        parents[0].chromosome * (1 - crossoverPoint),
      fitness: this.fitnessFunction(),
    };
    return [child1, child2];
  }

  mutate(individual, mutationRate) {
    if (Math.random() < mutationRate) {
      individual.chromosome = Math.random() * 10;
    }
  }

  fitnessFunction(x) {
    const targetValue = 0.5;
    const difference = Math.abs(x - targetValue);
    const fitnessScore = 1 / (1 + difference);
    return fitnessScore;
  }
}

function interpolateColor(color1, color2, factor) {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + factor * (r2 - r1))
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(g1 + factor * (g2 - g1))
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(b1 + factor * (b2 - b1))
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
}

export default FitnessLandscape;
