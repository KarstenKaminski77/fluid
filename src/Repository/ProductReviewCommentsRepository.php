<?php

namespace App\Repository;

use App\Entity\ProductReviewComments;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\OptimisticLockException;
use Doctrine\ORM\ORMException;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method ProductReviewComments|null find($id, $lockMode = null, $lockVersion = null)
 * @method ProductReviewComments|null findOneBy(array $criteria, array $orderBy = null)
 * @method ProductReviewComments[]    findAll()
 * @method ProductReviewComments[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ProductReviewCommentsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ProductReviewComments::class);
    }

    /**
     * @throws ORMException
     * @throws OptimisticLockException
     */
    public function add(ProductReviewComments $entity, bool $flush = true): void
    {
        $this->_em->persist($entity);
        if ($flush) {
            $this->_em->flush();
        }
    }

    /**
     * @throws ORMException
     * @throws OptimisticLockException
     */
    public function remove(ProductReviewComments $entity, bool $flush = true): void
    {
        $this->_em->remove($entity);
        if ($flush) {
            $this->_em->flush();
        }
    }

    public function adminFindByApproval($isApproved)
    {
        $queryBuilder = $this->createQueryBuilder('p')
            ->andWhere('p.isApproved = :isApproved')
            ->setParameter('isApproved', $isApproved)
            ->orderBy('p.created', 'DESC');
        return [$queryBuilder->getQuery(), $queryBuilder->getQuery()->getResult()];
    }

    // /**
    //  * @return ProductReviewComments[] Returns an array of ProductReviewComments objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('p.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?ProductReviewComments
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
