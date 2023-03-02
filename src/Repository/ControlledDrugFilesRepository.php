<?php

namespace App\Repository;

use App\Entity\ControlledDrugFiles;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ControlledDrugFiles>
 *
 * @method ControlledDrugFiles|null find($id, $lockMode = null, $lockVersion = null)
 * @method ControlledDrugFiles|null findOneBy(array $criteria, array $orderBy = null)
 * @method ControlledDrugFiles[]    findAll()
 * @method ControlledDrugFiles[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ControlledDrugFilesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ControlledDrugFiles::class);
    }

    public function add(ControlledDrugFiles $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(ControlledDrugFiles $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

//    /**
//     * @return ControlledDrugFiles[] Returns an array of ControlledDrugFiles objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('c')
//            ->andWhere('c.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('c.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?ControlledDrugFiles
//    {
//        return $this->createQueryBuilder('c')
//            ->andWhere('c.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
