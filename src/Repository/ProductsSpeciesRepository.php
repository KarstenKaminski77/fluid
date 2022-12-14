<?php

namespace App\Repository;

use App\Entity\ProductsSpecies;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ProductsSpecies>
 *
 * @method ProductsSpecies|null find($id, $lockMode = null, $lockVersion = null)
 * @method ProductsSpecies|null findOneBy(array $criteria, array $orderBy = null)
 * @method ProductsSpecies[]    findAll()
 * @method ProductsSpecies[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ProductsSpeciesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ProductsSpecies::class);
    }

    public function add(ProductsSpecies $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(ProductsSpecies $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return ProductsSpecies[] Returns an array of ProductsSpecies objects
     */
    public function findByDistributorProducts($distributorId)
    {
        return $this->createQueryBuilder('ps')
            ->select('ps','p','dp','s')
            ->join('ps.species', 's')
            ->join('ps.products', 'p')
            ->join('p.distributorProducts', 'dp')
            ->andWhere('dp.distributor = :distributorId')
            ->andWhere('p.isPublished = 1')
            ->andWhere('p.isActive = 1')
            ->setParameter('distributorId', $distributorId)
            ->groupBy('s.id')
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getArrayResult()
            ;
    }

    /**
     * @return ProductsSpecies[] Returns an array of ProductsSpecies objects
     */
    public function findByClinic($clinicId)
    {
        return $this->createQueryBuilder('ps')
            ->select('ps','p','pr','s')
            ->join('ps.species', 's')
            ->join('ps.products', 'p')
            ->join('p.productRetails', 'pr')
            ->andWhere('pr.clinic = :clinicId')
            ->setParameter('clinicId', $clinicId)
            ->andWhere('p.isPublished = 1')
            ->andWhere('p.isActive = 1')
            ->groupBy('s.id')
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getArrayResult()
            ;
    }

//    public function findOneBySomeField($value): ?ProductsSpecies
//    {
//        return $this->createQueryBuilder('p')
//            ->andWhere('p.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
